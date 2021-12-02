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
    this.dateTimeFields = null;

    activate();

    function itemData() {
        const _item = JSON.parse(JSON.stringify(templates.pickItemData(item)));

        self.dateTimeFields.forEach((field) => {
            if (_item.extra[field._id]) {
                const initialOffset = field.custom_field_config.initial_offset_minutes;

                _item.extra[field._id] = `{{ now|add_timedelta(minutes=${initialOffset})|iso_datetime }}`;
            }
        });
        return _item;
    }

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

        vocabularies.getVocabularies().then((_vocabularies) => {
            self.dateTimeFields = _vocabularies.filter((vocabulary) => vocabulary.custom_field_type === 'datetime');
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
        var data = {
            template_name: self.name,
            template_type: self.type,
            template_desks: self.is_public ? [self.desk] : null,
            is_public: self.is_public,
            data: itemData(),
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
                template.user = session.identity._id;
                template.template_desks = null;
            }
        }

        // if template is made private, set current user as template owner
        if (template.is_public === true && diff?.is_public === false) {
            diff.user = session.identity._id;
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
