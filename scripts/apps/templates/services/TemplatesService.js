import _ from 'lodash';
import {gettext} from 'core/utils';

TemplatesService.$inject = ['api', 'session', '$q', 'preferencesService', 'privileges', 'desks'];
export function TemplatesService(api, session, $q, preferencesService, privileges, desks) {
    var PAGE_SIZE = 10;
    var PREFERENCES_KEY = 'templates:recent';

    var KILL_TEMPLATE_IGNORE_FIELDS = ['dateline', 'template_desks', 'schedule_desk',
        'schedule_stage', 'schedule', 'next_run', 'last_run'];
    var self = this;

    this.TEMPLATE_METADATA = [
        'headline',
        'slugline',
        'abstract',
        'dateline',
        'byline',
        'subject',
        'genre',
        'type',
        'flags',
        'language',
        'anpa_category',
        'anpa_take_key',
        'keywords',
        'priority',
        'profile',
        'urgency',
        'pubstatus',
        'description_text',
        'body_html',
        'body_text',
        'body_footer',
        'place',
        'located',
        'creditline',
        'ednote',
        'language',
        'usageterms',
        'target_types',
        'target_regions',
        'target_subscribers',
        'format',
        'associations',
        'sign_off',
        'sms_message',
        'company_codes',
    ];

    /**
     * Filter out item data that is not usable for template
     *
     * @param {Object} item
     * @return {Object}
     */
    this.pickItemData = function(item) {
        return _.pick(item, this.TEMPLATE_METADATA);
    };

    const KILL_TYPE = 'kill';
    const CREATE_TYPE = 'create';
    const HIGHLIGHTS_TYPE = 'highlights';

    this.types = [
        {_id: KILL_TYPE, label: gettext('Kill')},
        {_id: CREATE_TYPE, label: gettext('Create')},
        {_id: HIGHLIGHTS_TYPE, label: gettext('Highlights')},
    ];

    /*
     * To fetch all the templates based on the user and its user_type
     * Used in template management screen.
     */
    this.fetchAllTemplates = function(page, pageSize, type, templateName) {
        var params = {
            page: page || 1,
            max_results: pageSize || PAGE_SIZE,
            sort: 'template_name',
        };

        var criteria = {};
        // in template management only see the templates that are create by the user

        criteria.$or = [{user: session.identity._id}];

        if (type !== undefined) {
            criteria.template_type = type;
        }

        if (templateName) {
            criteria.template_name = {$regex: templateName, $options: '-i'};
        }

        // if you are admin then you can edit public templates
        if (self.isAdmin(true)) {
            criteria.$or.push({is_public: true});
        } else if (self.isAdmin()) {
            var _criteria = criteria;

            criteria = desks.fetchCurrentUserDesks().then((desks) => {
                _criteria.$or.push({
                    is_public: true,
                    template_desks: {$in: desks.map((desk) => desk._id)},
                });

                return _criteria;
            });
        }

        return $q.when(criteria)
            .then((criteria) => {
                params.where = JSON.stringify({
                    $and: [criteria],
                });
                return params;
            })
            .then((params) => api.query('content_templates', params));
    };

    this.fetchTemplatesByDesk = function(desk) {
        let params = {
            sort: 'template_name',
            max_results: 200,
        };

        let deskCriteria = [
            {is_public: true},
        ];

        if (desk) {
            deskCriteria.push({template_desks: {$in: [desk]}});
        }

        let criteria = {$or: deskCriteria, template_type: CREATE_TYPE};

        if (!_.isEmpty(criteria)) {
            params.where = JSON.stringify({
                $and: [criteria],
            });
        }

        return api.query('content_templates', params);
    };

    this.fetchTemplatesByUserDesk = function(user, desk, page, pageSize, type, templateName) {
        var params = {
            page: page || 1,
            max_results: pageSize || PAGE_SIZE,
            sort: 'template_name',
        };

        var criteria = {};

        if (!user) {
            return $q.when();
        }

        var deskCriteria = [
            {template_desks: {$exists: false}, is_public: true},
            {template_desks: [], is_public: true},
        ];

        if (desk) {
            deskCriteria.push({template_desks: {$in: [desk]}, is_public: true});
        }

        criteria.$or = [{$or: deskCriteria}, {user: user, is_public: false}];

        if (type !== undefined) {
            criteria.template_type = type;
        }

        if (templateName) {
            criteria.template_name = {$regex: templateName, $options: '-i'};
        }

        if (!_.isEmpty(criteria)) {
            params.where = JSON.stringify({
                $and: [criteria],
            });
        }

        return api.query('content_templates', params);
    };

    this.fetchTemplatesByIds = function(templateIds) {
        if (!templateIds.length) {
            return $q.when([]);
        }

        var params = {
            max_results: PAGE_SIZE,
            page: 1,
            where: JSON.stringify({_id: {$in: templateIds}}),
        };

        return api.query('content_templates', params)
            .then((result) => {
                if (result && result._items) {
                    result._items.sort((a, b) => templateIds.indexOf(a._id) - templateIds.indexOf(b._id));
                }
                return result;
            });
    };

    /**
     * Find template by id
     *
     * @param {String} id
     * @return {Promise}
     */
    this.find = function(id) {
        return api.find('content_templates', id);
    };

    /**
     * Test if user is admin
     *
     * @param {bool} strict - if true user must be `administrator`, otherwise it's enough to have privileges
     * @return {bool}
     */
    this.isAdmin = function(strict) {
        let admin = session.identity.user_type === 'administrator';

        if (strict) {
            return admin;
        }

        return admin || privileges.privileges.content_templates;
    };

    this.addRecentTemplate = function(deskId, templateId) {
        return preferencesService.get()
            .then((result = {}) => {
                result[PREFERENCES_KEY] = result[PREFERENCES_KEY] || {};
                result[PREFERENCES_KEY][deskId] = result[PREFERENCES_KEY][deskId] || [];
                _.remove(result[PREFERENCES_KEY][deskId], (i) => i === templateId);
                result[PREFERENCES_KEY][deskId].unshift(templateId);
                return preferencesService.update(result);
            });
    };

    this.getRecentTemplateIds = function(deskId, limit = PAGE_SIZE) {
        return preferencesService.get()
            .then((result) => {
                if (result && result[PREFERENCES_KEY] && result[PREFERENCES_KEY][deskId]) {
                    return _.take(result[PREFERENCES_KEY][deskId], limit);
                }
                return [];
            });
    };

    this.getRecentTemplates = function(deskId, limit = PAGE_SIZE) {
        return this.getRecentTemplateIds(deskId, limit)
            .then(this.fetchTemplatesByIds);
    };

    /**
     * Save template
     *
     * @param {Object} orig
     * @param {Object} updates
     * @return {Promise}
     */
    this.save = function(orig, updates) {
        var template = angular.extend({data: {}}, updates);

        delete template._datelinedate;
        delete template.hasCrops;
        template.data.headline = trimSpaces(template.data.headline);
        template.data.body_html = trimSpaces(template.data.body_html);
        template.data = this.pickItemData(template.data);
        // certain field are not required for kill template
        if (template && template.template_type === 'kill') {
            template = _.omit(template, KILL_TEMPLATE_IGNORE_FIELDS);
        }
        return api.save('content_templates', orig, template);
    };

    function trimSpaces(value) {
        return value ? value.replace(/&nbsp;/g, '').trim() : '';
    }
}
