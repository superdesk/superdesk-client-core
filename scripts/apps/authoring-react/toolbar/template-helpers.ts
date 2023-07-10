import ng from 'core/services/ng';
import {extensions} from 'appConfig';
import {IArticle, ICustomFieldType, ITemplate, IVocabulary} from 'superdesk-api';

export function applyMiddleware(_item: IArticle): Promise<IArticle> {
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

export function prepareData(template: ITemplate) {
    return {
        name: template.template_name,
        desk: template.template_desks != null ? template.template_desks[0] : null,
        template,
    };
}

export function cleanData<T>(data: Partial<T>): Partial<T> {
    [
        '_type',
        '_status',
        '_updated',
        '_created',
        '_etag',
        '_links',
        '_id',
        '_current_version',
        '_etag',
        '_links',
        'expiry',
        'lock_user',
        'original_id',
        'schedule_settings',
        'semantics',
        '_autosave',
        '_editable',
        '_latest_version',
        '_locked',
        'time_zone',
        '_autosave',
    ].forEach((field) => {
        delete data[field];
    });

    return data;
}

/**
 * Determines whether the template will be overwritten or a new one will be created.
 * The is_public parameter is needed because we get it from user input and not from the fetched template.
 * is_public is set from the user - if the template is made as a desk template then is_public is true.
 */
export function canEdit(template: ITemplate, isPublic: boolean): boolean {
    const privileges = ng.get('privileges');

    if (template == null) {
        return false;
    } else if (template?.is_public && !isPublic) {
        // if template is changed from public to private, always
        // create a copy of a template and don't modify the original one.
        return false;
    } else if (isPublic) {
        return privileges.userHasPrivileges({content_templates: 1});
    } else if (template?.user === ng.get('session').identity._id) {
        return true;
    } else {
        return privileges.userHasPrivileges({personal_template: 1}); // can edit templates of other users
    }
}

export const wasRenamed = (
    template: ITemplate,
    templateName: string,
) => template != null && templateName !== template.template_name;

export const willCreateNew = (
    template: ITemplate,
    templateName: string,
    isPublic: boolean,
) => template == null || wasRenamed(template, templateName) || canEdit(template, isPublic) !== true;
