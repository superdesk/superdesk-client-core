import {OrderedMap} from 'immutable';
import {IArticle, IAuthoringFieldV2, IFieldsV2, IContentProfileV2} from 'superdesk-api';
import ng from 'core/services/ng';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {dataApi} from 'core/helpers/CrudManager';
import {authoringApiCommon} from 'apps/authoring-bridge/authoring-api-common';
import {generatePatch} from 'core/patch';
import {appConfig} from 'appConfig';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {AutoSaveHttp} from './auto-save-http';
import {omit} from 'lodash';
import {AUTOSAVE_TIMEOUT} from 'core/constants';
import {sdApi} from 'api';

function getContentProfile(item: IArticle): Promise<IContentProfileV2> {
    interface IFakeScope {
        schema: any;
        editor: any;
        fields: any;
    }

    let fakeScope: Partial<IFakeScope> = {};

    return Promise.all([
        getLabelNameResolver(),
        ng.get('content').setupAuthoring(item.profile, fakeScope, item),
    ]).then((res) => {
        const [getLabelForFieldId] = res;

        const {editor, fields} = fakeScope;

        const fieldsOrdered =
            Object.keys(editor)
                .map((key) => {
                    const result: {fieldId: string, editorItem: any} =
                        {
                            fieldId: key,
                            editorItem: editor[key],
                        };

                    return result;
                })
                .sort((a, b) => a.editorItem.order - b.editorItem.order);

        let headerFields: IFieldsV2 = OrderedMap<string, IAuthoringFieldV2>();
        let contentFields: IFieldsV2 = OrderedMap<string, IAuthoringFieldV2>();

        for (const {fieldId, editorItem} of fieldsOrdered) {
            const field = fields.find(({_id}) => _id === fieldId);

            const fieldV2: IAuthoringFieldV2 = {
                id: fieldId,
                name: getLabelForFieldId(fieldId),
                fieldType: field.custom_field_type,
                fieldConfig: field.custom_field_config,
            };

            if (editorItem.section === 'header') {
                headerFields = headerFields.set(fieldV2.id, fieldV2);
            } else if (editorItem.section === 'content') {
                contentFields = contentFields.set(fieldV2.id, fieldV2);
            } else {
                throw new Error('invalid section');
            }
        }

        const profile: IContentProfileV2 = {
            name: 'test content profile',
            header: headerFields,
            content: contentFields,
        };

        return profile;
    });
}

export interface IAuthoringAutoSave {
    get(id: IArticle['_id']): Promise<IArticle>;
    delete(id: IArticle['_id'], etag: IArticle['_etag']): Promise<void>;
    cancel(): void;

    /**
     * A function that returns the article is used to improve performance.
     * In order to get the latest article, data has to be serialized. Using a function
     * allows to only do it once after timeout passes, instead of on every character change.
     */
    schedule(getItem: () => IArticle, callback: (autosaved: IArticle) => void): void;
}

/**
 * {@link AuthoringReact} component will use this interface
 * instead of making network calls directly.
 * Alternative implementation can be used
 * to enable offline support.
 */
interface IAuthoringStorage {
    lock(itemId: IArticle['_id']): Promise<IArticle>;
    unlock(itemId: IArticle['_id']): Promise<IArticle>;
    getArticle(id: string): Promise<{saved: IArticle | null, autosaved: IArticle | null}>;
    saveArticle(current: IArticle, original: IArticle): Promise<IArticle>;
    closeAuthoring(
        current: IArticle,
        original: IArticle,
        cancelAutosave: () => Promise<void>,
        doClose: () => void,
    ): Promise<void>;
    getContentProfile(item: IArticle): Promise<IContentProfileV2>;
    getUserPreferences(): Promise<any>;
    autosave: IAuthoringAutoSave;
}

export function omitFields(item: Partial<IArticle>): Partial<IArticle> {
    /**
     * TODO: try getting rid of these when angular based monitoring is dropped.
     * When sending patches, these fields will automatically be excluded by patching algorithm
     * When receiving patches, server should be fixed if it sends invalid data.
     */

    const customFields = [
        '_latest_version',
        'revert_state',
        'expiry',
        '_current_version',
        'original_id',
        'ingest_version',
    ];

    const baseApiFields = [
        '_created',
        '_links',
        '_updated',
        '_etag',
        '_status',
    ];

    return {...omit(item, [...customFields, ...baseApiFields])};
}

export const authoringStorage: IAuthoringStorage = {
    autosave: new AutoSaveHttp(AUTOSAVE_TIMEOUT),
    getArticle: (id) => {
        // TODO: take published items into account

        return dataApi.findOne<IArticle>('archive', id).then((saved) => {
            if (sdApi.article.isLockedInOtherSession(saved)) {
                return {saved, autosaved: null};
            } else if (sdApi.article.isLockedInCurrentSession(saved)) {
                return new Promise<IArticle>((resolve) => {
                    authoringStorage.autosave.get(id)
                        .then((autosaved) => {
                            resolve(autosaved);
                        })
                        .catch(() => {
                            resolve(null);
                        });
                }).then((autosaved) => ({saved, autosaved}));
            } else {
                return {saved, autosaved: null};
            }
        });
    },
    lock: sdApi.article.lock,
    unlock: sdApi.article.unlock,
    saveArticle: (current, original) => {
        return authoringApiCommon.saveBefore(current, original).then((_current) => {
            const id = original._id;
            const etag = original._etag;

            const diff = generatePatch(original, _current);

            const queryString = appConfig.features.publishFromPersonal === true
                ? '?publish_from_personal=true'
                : '';

            return httpRequestJsonLocal<IArticle>({
                method: 'PATCH',
                path: `/archive/${id}${queryString}`,
                payload: omitFields(diff),
                headers: {
                    'If-Match': etag,
                },
            }).then((next) => {
                authoringApiCommon.saveAfter(next, original);

                return next;
            });
        });
    },
    getContentProfile,
    closeAuthoring: (current, original, cancelAutosave, doClose) => {
        const diff = generatePatch(original, current);
        const hasUnsavedChanges = Object.keys(diff).length > 0;

        const unlockArticle = (id: string) => httpRequestJsonLocal<void>({
            method: 'POST',
            payload: {},
            path: `/archive/${id}/unlock`,
        });

        return authoringApiCommon.closeAuthoring(
            original,
            hasUnsavedChanges,
            () => authoringStorage.saveArticle(current, original).then(() => undefined),
            () => unlockArticle(original._id),
            cancelAutosave,
            doClose,
        );
    },
    getUserPreferences: () => ng.get('preferencesService').get(),
};
