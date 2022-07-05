import {OrderedMap} from 'immutable';
import {
    IArticle,
    IAuthoringFieldV2,
    IFieldsV2,
    IContentProfileV2,
    ICommonFieldConfig,
    IAuthoringStorage,
    IFieldsAdapter,
} from 'superdesk-api';
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
import {getArticleAdapter} from './article-adapter';

function getContentProfile(item: IArticle, fieldsAdapter: IFieldsAdapter): Promise<IContentProfileV2> {
    interface IFakeScope {
        schema: any;
        editor: any;
        fields: any;
    }

    let fakeScope: Partial<IFakeScope> = {};

    /**
     * Some fields require restructuring to work well in authoring-react.
     * When angular based authoring is removed, an update script should be written,
     * and this restructuring code dropped.
     */
    function adjustId(fieldId: string): string {
        switch (fieldId) {
        case 'sms':
            // in content profile the field ID is "sms"
            // but value is written to `IArticle['sms_message']`
            return 'sms_message';
        default:
            return fieldId;
        }
    }

    return Promise.all([
        getLabelNameResolver(),
        ng.get('content').setupAuthoring(item.profile, fakeScope, item),
    ]).then((res) => {
        const [getLabelForFieldId] = res;

        const {editor, fields, schema} = fakeScope;

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

        for (const _field of fieldsOrdered) {
            const {editorItem} = _field;
            const fieldId = adjustId(_field.fieldId);

            const fieldEditor = editor[_field.fieldId] ?? {}; // unadjusted fieldId has to be used
            const fieldSchema = schema[_field.fieldId] ?? {}; // unadjusted fieldId has to be used

            const commonConfigs: ICommonFieldConfig = {
                readOnly: fieldEditor.readonly === true,
                required: fieldEditor.required === true,
                allow_toggling: fieldEditor.allow_toggling === true,
            };

            const fieldV2: IAuthoringFieldV2 = (() => {
                if (fieldsAdapter.hasOwnProperty(fieldId)) { // main, hardcoded fields
                    const f: IAuthoringFieldV2 = fieldsAdapter[fieldId].getFieldV2(fieldEditor, fieldSchema);

                    return {
                        ...f,
                        fieldConfig: {
                            ...commonConfigs,
                            ...f.fieldConfig, // adapter should be capable of overwriting common configs
                        },
                    };
                } else { // custom fields
                    const field = fields.find(({_id}) => _id === fieldId);

                    const f: IAuthoringFieldV2 = {
                        id: fieldId,
                        name: getLabelForFieldId(fieldId),
                        fieldType: field.custom_field_type,
                        fieldConfig: {
                            ...commonConfigs,
                            ...(field.custom_field_config ?? {}),
                        },
                    };

                    return f;
                }
            })();

            if (editorItem.section === 'header') {
                headerFields = headerFields.set(fieldV2.id, fieldV2);
            } else if (editorItem.section === 'content') {
                contentFields = contentFields.set(fieldV2.id, fieldV2);
            } else {
                throw new Error('invalid section');
            }
        }

        const profile: IContentProfileV2 = {
            id: item.profile,
            name: 'test content profile',
            header: headerFields,
            content: contentFields,
        };

        return profile;
    });
}

export function omitFields(
    item: Partial<IArticle>,
    omitId: boolean = false, // useful when patching
): Partial<IArticle> {
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
        'refs',
        'linked_in_packages',
    ];

    const baseApiFields = [
        '_created',
        '_links',
        '_updated',
        '_etag',
        '_status',
    ];

    if (omitId) {
        baseApiFields.push('_id');
    }

    return {...omit(item, [...customFields, ...baseApiFields])};
}

export const authoringStorageIArticle: IAuthoringStorage<IArticle> = {
    autosave: new AutoSaveHttp(AUTOSAVE_TIMEOUT),
    getArticle: (id) => {
        // TODO: take published items into account

        return dataApi.findOne<IArticle>('archive', id).then((_saved) => {
            const adapter = getArticleAdapter();

            const saved = adapter.toAuthoringReact(_saved);

            if (sdApi.article.isLockedInOtherSession(saved)) {
                return {saved, autosaved: null};
            } else if (sdApi.article.isLockedInCurrentSession(saved)) {
                return new Promise<IArticle>((resolve) => {
                    authoringStorageIArticle.autosave.get(id)
                        .then((_autosaved) => {
                            resolve(adapter.toAuthoringReact(_autosaved));
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
    lock: (id: IArticle['_id']) => {
        return sdApi.article.lock(id).then((article) => {
            const adapter = getArticleAdapter();

            return adapter.toAuthoringReact(article);
        });
    },
    unlock: (id: IArticle['_id']) => {
        return sdApi.article.unlock(id).then((article) => {
            const adapter = getArticleAdapter();

            return adapter.toAuthoringReact(article);
        });
    },
    saveArticle: (current, original) => {
        const adapter = getArticleAdapter();

        return authoringApiCommon.saveBefore(current, original).then((_current) => {
            const id = original._id;
            const etag = original._etag;

            let diff = generatePatch(original, _current);

            // when object has changes, send entire object to avoid server dropping keys
            if (diff.fields_meta != null) {
                diff.fields_meta = _current.fields_meta;
            }

            // when object has changes, send entire object to avoid server dropping keys
            if (diff.extra != null) {
                diff.extra = _current.extra;
            }

            // when object has changes, send entire object to avoid server dropping keys
            if (diff.associations != null) {
                diff.associations = _current.associations;
            }

            diff = adapter.fromAuthoringReact(diff);

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

                return adapter.toAuthoringReact(next);
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
            () => authoringStorageIArticle.saveArticle(current, original).then(() => undefined),
            () => unlockArticle(original._id),
            cancelAutosave,
            doClose,
        );
    },
    getUserPreferences: () => ng.get('preferencesService').get(),
};
