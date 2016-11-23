import notifySaveError from '../helpers';

CreateTemplateController.$inject = ['item', 'templates', 'api', 'desks', '$q', 'notify', 'lodash'];
export function CreateTemplateController(item, templates, api, desks, $q, notify, _) {
    var self = this;

    this.type = 'create';
    this.name = item.slugline || null;
    this.desk = desks.active.desk || null;
    this.is_public = false;

    this.types = templates.types;
    this.createTypes = _.filter(templates.types, function(element) {
        return element._id !== 'kill';
    });
    this.save = save;

    activate();

    function activate() {
        if (item.template) {
            api.find('content_templates', item.template).then(function(template) {
                self.name = template.template_name;
                self.desk = template.template_desks != null ? template.template_desks[0] : null;
                self.is_public = template.is_public !== false;
                self.template = template;
            });
        }

        desks.fetchCurrentUserDesks().then(function(desks) {
            self.desks = desks;
        });
    }

    function save() {
        var data = {
            template_name: self.name,
            template_type: self.type,
            template_desks: self.is_public ? [self.desk] : null,
            is_public: self.is_public,
            data: templates.pickItemData(item)
        };

        var template = self.template ? self.template : data;
        var diff = self.template ? data : null;

        // in case there is old template but user renames it - create a new one
        if (self.template && self.name !== self.template.template_name) {
            template = data;
            diff = null;
        }

        return api.save('content_templates', template, diff)
        .then(function(data) {
            self._issues = null;
            return data;
        }, function(response) {
            notifySaveError(response, notify);
            self._issues = response.data._issues;
            return $q.reject(self._issues);
        });
    }
}
