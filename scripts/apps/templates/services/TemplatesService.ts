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
        'extra',
        'authors',
        'fields_meta',
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
        var params: any = {
            sort: 'template_name',
            manage: true,
        };

        var criteria: any = {};

        if (type !== undefined) {
            criteria.template_type = type;
        }

        if (templateName) {
            criteria.template_name = {$regex: templateName, $options: '-i'};
        }

        return $q.when(criteria)
            .then((criteriaReady) => {
                if (Object.keys(criteriaReady || {}).length > 0) {
                    params.where = JSON.stringify({
                        $and: [criteriaReady],
                    });
                }
                return params;
            })
            .then((_params) => api.query('content_templates', _params));
    };

    this.fetchTemplatesByDesk = function(desk) {
        let params: any = {
            sort: 'template_name',
        };

        let criteria = {template_type: CREATE_TYPE};

        if (desk) {
            criteria['$or'] = [{template_desks: {$in: [desk]}}];
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
