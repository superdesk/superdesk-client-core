import notifySaveError from '../helpers';
import {sdApi} from 'api';
import {willCreateNew} from 'apps/authoring-react/toolbar/template-helpers';

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
                const data = sdApi.templates.prepareData(template);

                self.name = data.template.template_name;
                self.desk = data.desk;
                self.is_public = data.template.is_public;
                self.template = data.template;
            });
        }

        desks.fetchCurrentUserDesks().then((_desks) => {
            self.desks = _desks;
        });
    }

    self.willCreateNew = () => willCreateNew(self.template, self.name, self.is_public);

    function save() {
        return sdApi.templates.save(item, self.name, self.is_public ? self.desk : null)
            .then((data) => {
                self._issues = null;
                return data;
            })
            .catch((error) => {
                notifySaveError({data: error}, notify);
                self._issues = error._issues;
                return $q.reject(self._issues);
            });
    }
}
