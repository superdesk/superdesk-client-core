import notifySaveError from '../helpers';

CreateTemplateController.$inject = ['item', 'templates', 'api', 'desks', '$q', 'notify', 'lodash'];
export function CreateTemplateController(item, templates, api, desks, $q, notify, _) {
    var vm = this;

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
                vm.name = template.template_name;
                vm.desk = template.template_desks != null ? template.template_desks[0] : null;
                vm.is_public = template.is_public !== false;
                vm.template = template;
            });
        }

        desks.fetchCurrentUserDesks().then(function(desks) {
            vm.desks = desks;
        });
    }

    function save() {
        var data = {
            template_name: vm.name,
            template_type: vm.type,
            template_desks: vm.is_public ? [vm.desk] : null,
            is_public: vm.is_public,
            data: templates.pickItemData(item)
        };

        var template = vm.template ? vm.template : data;
        var diff = vm.template ? data : null;

        // in case there is old template but user renames it - create a new one
        if (vm.template && vm.name !== vm.template.template_name) {
            template = data;
            diff = null;
        }

        return api.save('content_templates', template, diff)
        .then(function(data) {
            vm._issues = null;
            return data;
        }, function(response) {
            notifySaveError(response, notify);
            vm._issues = response.data._issues;
            return $q.reject(vm._issues);
        });
    }
}
