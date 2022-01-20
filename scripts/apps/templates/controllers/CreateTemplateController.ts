import notifySaveError from '../helpers';
import {extensions} from 'appConfig';
import {IArticle, ICustomFieldType, IVocabulary} from 'superdesk-api';

/**
 * Iterate content profile fields.
 * Check if field is a custom field from extension.
 * If it is, run `onTemplateCreate` middleware on it
 * and update the value.
 */
function applyMiddleware(_item: IArticle, content, vocabularies): Promise<IArticle> {
    // Custom field types with `onTemplateCreate` defined. From all extensions.
    const fieldTypes: {[id: string]: ICustomFieldType<any, any, any>} = {};

    Object.values(extensions).forEach((ext) => {
        ext?.activationResult?.contributions?.customFieldTypes?.forEach(
            (customField: ICustomFieldType<any, any, any>) => {
                if (customField.onTemplateCreate != null) {
                    fieldTypes[customField.id] = customField;
                }
            },
        );
    });

    return vocabularies.getVocabularies().then((_vocabularies: Array<IVocabulary>) => {
        const fakeScope: any = {};

        return content.setupAuthoring(_item.profile, fakeScope, _item).then(() => {
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

CreateTemplateController.$inject = [
    'item',
    'templates',
    'api',
    'desks',
    '$q',
    'notify',
    'lodash',
    'privileges',
    'session',
    'content',
    'vocabularies',
];
export function CreateTemplateController(
    item,
    templates,
    api,
    desks,
    $q,
    notify,
    _,
    privileges,
    session,
    content,
    vocabularies,
) {
    var self = this;

    this.type = 'create';
    this.name = item.slugline || null;
    this.desk = desks.active.desk || null;
    this.is_public = false;

    this.types = templates.types;
    this.createTypes = _.filter(templates.types, (element) => element._id !== 'kill');
    this.save = save;

    activate();

    function activate() {
        if (item.template) {
            api.find('content_templates', item.template).then((template) => {
                self.name = template.template_name;
                self.desk = !_.isNil(template.template_desks) ? template.template_desks[0] : null;
                self.is_public = template.is_public !== false;
                self.template = template;
            });
        }

        desks.fetchCurrentUserDesks().then((_desks) => {
            self.desks = _desks;
        });
    }

    self.canEdit = () => {
        if (self.template == null) {
            return false; // no template exists yet
        } else if (self.template?.is_public === true && self.is_public === false) {
            // if template is changed from public to private, always create a copy of a template
            // and don't modify the original one.
            return false;
        } else if (self.is_public === true) {
            return privileges.userHasPrivileges({content_templates: 1});
        } else if (self.template?.user === session.identity._id) {
            return true; // can always edit own templates
        } else {
            return privileges.userHasPrivileges({personal_template: 1}); // can edit templates of other users
        }
    };

    self.wasRenamed = () => {
        return self.template != null && self.name !== self.template.template_name;
    };

    self.willCreateNew = () =>
        self.template == null // no template exists yet
        || self.wasRenamed()
        || self.canEdit() !== true;

    function save() {
        const _item: IArticle = JSON.parse(JSON.stringify(templates.pickItemData(item)));
        const sessionId = session.identity._id;

        return applyMiddleware(_item, content, vocabularies).then((itemAfterMiddleware) => {
            var data = {
                template_name: self.name,
                template_type: self.type,
                template_desks: self.is_public ? [self.desk] : null,
                is_public: self.is_public,
                data: itemAfterMiddleware,
            };

            var template = self.template ? self.template : data;
            var diff: any = self.template ? data : null;

            // in case there is old template but user renames it
            // or user is not allowed to edit it - create a new one
            if (self.willCreateNew()) {
                template = data;
                diff = null;

                if (self.canEdit() !== true) {
                    template.is_public = false;
                    template.user = sessionId;
                    template.template_desks = null;
                }
            }

            // if template is made private, set current user as template owner
            if (template.is_public === true && diff?.is_public === false) {
                diff.user = sessionId;
            }

            return api.save('content_templates', template, diff)
                .then((_data) => {
                    self._issues = null;
                    return _data;
                }, (response) => {
                    notifySaveError(response, notify);
                    self._issues = response.data._issues;
                    return $q.reject(self._issues);
                });
        });
    }
}
