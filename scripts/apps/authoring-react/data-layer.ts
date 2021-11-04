import {OrderedMap} from 'immutable';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {dataApi} from 'core/helpers/CrudManager';
import {authoringApiCommon} from 'apps/authoring-bridge/authoring-api-common';
import {generatePatch} from 'core/patch';
import {appConfig} from 'appConfig';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';

interface IFieldBase {
    id: string;
    name: string;
}

interface IFieldText extends IFieldBase {
    type: 'text';
}

interface IFieldFromExtension extends IFieldBase {
    type: 'from-extension';
    extension_field_type: string;
    extension_field_config: any;
}

export type IAuthoringFieldV2 = IFieldText | IFieldFromExtension;

export type IFieldsV2 = OrderedMap<string, IAuthoringFieldV2>;

export interface IContentProfileV2 {
    name: string;
    header: IFieldsV2;
    content: IFieldsV2;
}

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

            const fieldV2: IAuthoringFieldV2 = (() => {
                if (field == null) {
                    const result: IAuthoringFieldV2 = {
                        id: fieldId,
                        name: getLabelForFieldId(fieldId),
                        type: 'text',
                    };

                    return result;
                } else if (field.field_type === 'custom') {
                    const result: IAuthoringFieldV2 = {
                        id: fieldId,
                        name: getLabelForFieldId(fieldId),
                        type: 'from-extension',
                        extension_field_type: field.custom_field_type,
                        extension_field_config: field.custom_field_config,
                    };

                    return result;
                } else {
                    const result: IAuthoringFieldV2 = {
                        id: fieldId,
                        name: getLabelForFieldId(fieldId),
                        type: 'text',
                    };

                    return result;
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
            name: 'test content profile',
            header: headerFields,
            content: contentFields,
        };

        return profile;
    });
}

interface IAuthoringStorage {
    getArticle(id: string): Promise<IArticle>;
    saveArticle(current: IArticle, original: IArticle): Promise<IArticle>;
    unlockArticle(id: string): Promise<void>;
    getContentProfile(item: IArticle): Promise<IContentProfileV2>;
}

export const authoringStorage: IAuthoringStorage = {
    getArticle: (id) => {
        // TODO: take published items into account
        return dataApi.findOne<IArticle>('archive', id);
    },
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
                payload: diff,
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
    unlockArticle: (id) => {
        return httpRequestJsonLocal<void>({
            method: 'POST',
            payload: {},
            path: `/archive/${id}/unlock`,
        });
    },
};
