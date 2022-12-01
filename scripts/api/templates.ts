import {extensions} from 'appConfig';
import {httpRequestJsonLocal} from 'core/helpers/network';
import ng from 'core/services/ng';
import {IArticle, ICustomFieldType, ITemplate, IVocabulary} from 'superdesk-api';

function getById(id: ITemplate['_id']): Promise<ITemplate> {
    return httpRequestJsonLocal<ITemplate>({
        method: 'GET',
        path: `/content_templates/${id}`,
    });
}

function applyMiddleware(_item: IArticle): Promise<IArticle> {
    // Custom field types with `onTemplateCreate` defined. From all extensions.
    const fieldTypes: {[id: string]: ICustomFieldType<any, any, any, any>} = {};

    Object.values(extensions).forEach((ext) => {
        ext?.activationResult?.contributions?.customFieldTypes?.forEach(
            (customField: ICustomFieldType<any, any, any, any>) => {
                if (customField.onTemplateCreate != null) {
                    fieldTypes[customField.id] = customField;
                }
            },
        );
    });

    return ng.get('vocabularies').getVocabularies().then((_vocabularies: Array<IVocabulary>) => {
        const fakeScope: any = {};

        return ng.get('content').setupAuthoring(_item.profile, fakeScope, _item).then(() => {
            let itemNext: IArticle = {..._item};

            for (const fieldId of Object.keys(fakeScope.editor)) {
                const vocabulary = _vocabularies.find(({_id}) => _id === fieldId);

                if (vocabulary != null && fieldTypes[vocabulary.custom_field_type] != null) {
                    const config = vocabulary.custom_field_config ?? {};
                    const customField = fieldTypes[vocabulary.custom_field_type];

                    itemNext = {
                        ...itemNext,
                        extra: {
                            ...itemNext.extra,
                            [fieldId]: customField.onTemplateCreate(
                                itemNext?.extra?.[fieldId],
                                config,
                            ),
                        },
                    };
                }
            }

            return itemNext;
        });
    });
}

function prepareData(template: ITemplate) {
    return {
        name: template.template_name,
        desk: template.template_desks != null ? null : template.template_desks[0],
        is_public: template.is_public !== false,
        template,
    };
}

function save(item: IArticle, templateName: string, selectedDesk: string | null): Promise<ITemplate> {
    let name;
    let desk;
    let is_public;
    let template;

    return getById(item.template).then((resultTemplate) => {
        const data = prepareData(resultTemplate);

        name = data.name;
        desk = selectedDesk || data.desk;
        is_public = data.is_public;
        template = data.template;
    }).then(() => {
        const _item: IArticle = JSON.parse(JSON.stringify(ng.get('templates').pickItemData(item)));
        const sessionId = ng.get('session').identity._id;

        return applyMiddleware(_item).then((itemAfterMiddleware) => {
            let data: Partial<ITemplate> = {
                template_name: templateName,
                template_type: 'create',
                template_desks: is_public ? [desk] : null,
                is_public: is_public,
                data: itemAfterMiddleware,
            };

            let templateTemp: Partial<ITemplate> = template != null ? template : data;
            let diff = template != null ? data : null;

            const wasRenamed = template != null && name !== templateName;

            const willCreateNew = template == null || wasRenamed || canEdit(template, is_public) !== true;

            if (willCreateNew) {
                templateTemp = data;
                diff = null;

                if (canEdit(template, is_public) !== true) {
                    templateTemp.is_public = false;
                    templateTemp.user = sessionId;
                    templateTemp.template_desks = null;
                }
            }

            // if template is made private, set current user as template owner
            if (templateTemp.is_public === true && diff?.is_public === false) {
                diff.user = sessionId;
            }

            return ng.get('api').save('content_templates', templateTemp, diff)
                .then((_data) => {
                    return _data;
                }, (response) => {
                    return Promise.reject(response);
                });
        });
    });
}

function canEdit(template: any, is_public: boolean) {
    const privileges = ng.get('privileges');

    if (template == null) {
        return false;
    } else if (template?.is_public === true && is_public === false) {
        // if template is changed from public to private, always
        // create a copy of a template and don't modify the original one.
        return false;
    } else if (is_public === true) {
        return privileges.userHasPrivileges({content_templates: 1});
    } else if (template?.user === ng.get('session').identity._id) {
        return true;
    } else {
        return privileges.userHasPrivileges({personal_template: 1}); // can edit templates of other users
    }
}

export const templates = {
    getById,
    save,
    prepareData,
};
