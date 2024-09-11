import {OrderedMap} from 'immutable';
import {
    IArticle,
    IAuthoringFieldV2,
    IFieldsV2,
    IContentProfileV2,
    ICommonFieldConfig,
    IAuthoringStorage,
    IFieldsAdapter,
    IAuthoringAutoSave,
    IAuthoringActionType,
} from 'superdesk-api';
import ng from 'core/services/ng';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {dataApi} from 'core/helpers/CrudManager';
import {authoringApiCommon} from 'apps/authoring-bridge/authoring-api-common';
import {generatePatch} from 'core/patch';
import {appConfig} from 'appConfig';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {AutoSaveHttp} from './auto-save-http';
import {isObject, noop, omit} from 'lodash';
import {AUTOSAVE_TIMEOUT} from 'core/constants';
import {sdApi} from 'api';
import {getArticleAdapter} from './article-adapter';
import {gettext} from 'core/utils';
import {PACKAGE_ITEMS_FIELD_ID} from './fields/package-items';
import {description_text} from './field-adapters/description_text';
import {formatDateTime} from 'core/get-superdesk-api-implementation';

export function getArticleContentProfile<T>(
    item: IArticle,
    fieldsAdapter: IFieldsAdapter<T>,
): Promise<IContentProfileV2> {
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
        const fieldExists = (fieldId) => fakeScope.editor[fieldId] != null;

        const fieldsToOmit = [
            /**
             * Avoid having unnecessary adapters for fields to which we do not write data e.g. 'footer'.
             * authoring-react doesn't support companion fields like 'footer' that don't have data on
             * their own but simply modify the data of other fields.
             */
            'footer',

            /**
             * `media_description` isn't used anywhere. It might still be present in content profiles, so
             * I'm omitting it here to prevent authoring-react from crashing trying to render it.
             */
            'media_description',
        ];

        const fieldsOrdered =
            Object.keys(editor)
                .filter((key) => editor[key] != null && !fieldsToOmit.includes(key)) // don't take disabled ones
                .map((key) => {
                    const result: {fieldId: string, editorItem: any} = {
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

            const convertWidth = (width: string): number => {
                if (width === 'full') {
                    return 100;
                } else if (width === 'half') {
                    return 50;
                } else if (width === 'quarter') {
                    return 25;
                } else {
                    return 100;
                }
            };

            const commonConfigs: ICommonFieldConfig = {
                readOnly: fieldEditor.readonly === true,
                required: fieldEditor.required === true,
                allow_toggling: fieldEditor.allow_toggling === true,
                width: convertWidth(fieldEditor.sdWidth),
            };

            const fieldV2: IAuthoringFieldV2 = (() => {
                if (fieldsAdapter.hasOwnProperty(fieldId)) { // main, hardcoded fields
                    const f: IAuthoringFieldV2 = fieldsAdapter[fieldId]
                        .getFieldV2(fieldEditor, fieldSchema, fieldExists);

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

        // TODO: write an upgrade script and remove hardcoding
        // after angular based authoring is removed from the codebase
        if (['picture', 'audio', 'video', 'graphic'].includes(item.type)) {
            const description_field = description_text.getFieldV2(
                fakeScope.editor,
                fakeScope.schema,
                fieldExists,
            );

            contentFields = contentFields.set(description_field.id, description_field);
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

function getPackagesContentProfile<T>(
    item: IArticle,
    fieldsAdapter: IFieldsAdapter<T>,
): Promise<IContentProfileV2> {
    const headlineField: IAuthoringFieldV2 = {
        id: 'headline',
        name: gettext('Headline'),
        fieldType: 'editor3',
        fieldConfig: {
            required: true,
        },
    };
    const articlesInPackageField: IAuthoringFieldV2 = {
        id: 'groups',
        name: gettext('Package items'),
        fieldType: PACKAGE_ITEMS_FIELD_ID,
        fieldConfig: {
            readOnly: false,
            allow_toggling: false,
            required: true,
        },
    };

    return Promise.resolve<IContentProfileV2>({
        id: 'packages-profile',
        name: gettext('Packages profile'),
        header: OrderedMap([
            [headlineField.id, headlineField],
        ]),
        content: OrderedMap([
            [articlesInPackageField.id, articlesInPackageField],
        ]),
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
    getEntity: (id) => {
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
    isLockedInCurrentSession: (article) => sdApi.article.isLockedInCurrentSession(article),
    forceLock(entity) {
        return sdApi.article.unlock(entity._id)
            .then(() => sdApi.article.lock(entity._id))
            .then((article) => {
                const adapter = getArticleAdapter();

                return adapter.toAuthoringReact(article);
            });
    },
    saveEntity: (current, original) => {
        const adapter = getArticleAdapter();

        return authoringApiCommon.saveBefore(current, original).then((_current) => {
            const id = original._id;
            const etag = original._etag;

            let diff = generatePatch(original, _current);

            // Object patching is overriding fields of object type with diff.
            // If we make changes to such a field it is not saved correctly.
            // So we need to add all fields which are of object type to the diff object.
            Object.keys(diff).forEach((key) => {
                if (isObject(diff[key])) {
                    diff[key] = _current[key];
                }
            });

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
    getContentProfile: (item, fieldsAdapter) => {
        if (item.type === 'composite') {
            return getPackagesContentProfile(item, fieldsAdapter);
        } else {
            return getArticleContentProfile(item, fieldsAdapter);
        }
    },
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
            () => authoringStorageIArticle.saveEntity(current, original).then(() => undefined),
            () => unlockArticle(original._id),
            cancelAutosave,
            doClose,
        );
    },
    getUserPreferences: () => ng.get('preferencesService').get(),
};

class AutoSaveKill implements IAuthoringAutoSave<IArticle> {
    get() {
        return Promise.resolve({} as IArticle);
    }

    delete() {
        return Promise.resolve();
    }

    schedule(
        getItem: () => IArticle,
        callback: (autosaved: IArticle) => void,
    ) {
        callback(getItem());
    }

    cancel() {
        // noop
    }

    flush(): Promise<void> {
        return Promise.resolve();
    }
}

export const getAuthoringStorageIArticleKillOrTakedown = (
    action: IAuthoringActionType,
): IAuthoringStorage<IArticle> => ({
    ...authoringStorageIArticle,
    autosave: new AutoSaveKill(),
    getEntity: (id) => {
        return authoringStorageIArticle.getEntity(id).then(({saved, autosaved}) => {
            return sdApi.article.getItemPatchWithKillOrTakedownTemplate(saved, action).then((updated) => {
                return {
                    saved: {
                        ...updated,
                        ...saved, // updated is missing original_creator property so we get it from the saved article
                    },
                    autosaved: autosaved,
                };
            });
        });
    },
    saveEntity: () => new Promise(noop),
});

export const authoringStorageIArticleCorrect: IAuthoringStorage<IArticle> = {
    ...authoringStorageIArticle,
    autosave: new AutoSaveKill(),
    getEntity: (id) => {
        return authoringStorageIArticle.getEntity(id).then(({saved, autosaved}) => {
            const newItem = {...saved};

            newItem.flags.marked_for_sms = false;
            newItem.sms_message = '';

            const {override_ednote_for_corrections, override_ednote_template} = appConfig;

            const date = formatDateTime(newItem.versioncreated);

            if (override_ednote_for_corrections && override_ednote_template == null) {
                const lineBreak = '\r\n\r\n';
                const slugline = newItem.slugline ? '"' + newItem.slugline + '"' : '';

                newItem.ednote = gettext(
                    'In the story {{slugline}} sent at: {{date}}.{{lineBreak}}This is a corrected repeat.',
                    {slugline, date, lineBreak},
                );
            } else if (override_ednote_for_corrections) {
                newItem.ednote = override_ednote_template
                    .replace('{date}', date)
                    .replace('{slugline}', newItem.slugline ?? '');
            }

            delete newItem.fields_meta['ednote'];

            return {
                saved: newItem,
                autosaved: newItem,
            };
        });
    },
    saveEntity: () => new Promise(noop),
};
