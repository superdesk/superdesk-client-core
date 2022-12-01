import notifySaveError from '../helpers';
import {sdApi} from 'api';

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

    function save() {
        return sdApi.templates.save(item, self.name, self.desk)
            .then((data) => {
                self._issues = null;
                return data;
            })
            .catch((error) => {
                notifySaveError(error, notify);
                self._issues = error.data._issues;
                return $q.reject(self._issues);
            });
    }
}
