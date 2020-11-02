import notifySaveError from '../helpers';

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
        if (self.template?.is_public === true) {
            return privileges.userHasPrivileges({content_templates: 1});
        } else if (self.template?.user === session.identity._id) {
            return true; // can always edit own templates
        } else {
            return privileges.userHasPrivileges({personal_template: 1}); // can edit templates of other users
        }
    };

    self.wasRenamed = () => {
        return self.template && self.name !== self.template.template_name;
    };

    self.willCreateNew = () => self.wasRenamed() || self.canEdit() !== true;

    function save() {
        var data = {
            template_name: self.name,
            template_type: self.type,
            template_desks: self.is_public ? [self.desk] : null,
            is_public: self.is_public,
            data: templates.pickItemData(item),
        };

        var template = self.template ? self.template : data;
        var diff = self.template ? data : null;

        // in case there is old template but user renames it
        // or user is not allowed to edit it - create a new one
        if (self.willCreateNew()) {
            template = data;
            diff = null;

            if (self.canEdit() !== true) {
                template.is_public = false;
                template.user = session.identity._id;
                template.template_desks = [];
            }
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
    }
}
