TemplatesService.$inject = ['api', 'session', '$q', 'gettext', 'preferencesService'];
export function TemplatesService(api, session, $q, gettext, preferencesService) {
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
        'format'
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

    this.types = [
        {_id: 'kill', label: gettext('Kill')},
        {_id: 'create', label: gettext('Create')},
        {_id: 'highlights', label: gettext('Highlights')}
    ];

    /*
     * To fetch all the templates based on the user and its user_type
     * Used in template management screen.
     */
    this.fetchAllTemplates = function(page, pageSize, type, templateName) {
        var params = {
            page: page || 1,
            max_results: pageSize || PAGE_SIZE,
            sort: 'template_name'
        };

        var criteria = {};
        // in template management only see the templates that are create by the user
        criteria.$or = [{user: session.identity._id}];

        // if you are admin then you can edit public templates
        if (self.isAdmin()) {
            criteria.$or.push({is_public: true});
        }

        if (type !== undefined) {
            criteria.template_type = type;
        }

        if (templateName) {
            criteria.template_name = {'$regex': templateName, '$options': '-i'};
        }

        params.where = JSON.stringify({
            '$and': [criteria]
        });

        return api.query('content_templates', params);
    };

    this.fetchTemplatesByUserDesk = function (user, desk, page, pageSize, type, templateName) {
        var params = {
            page: page || 1,
            max_results: pageSize || PAGE_SIZE,
            sort: 'template_name'
        };

        var criteria = {};

        if (!user) {
            return $q.when();
        }

        var desk_criteria = [
            {'template_desks': {'$exists': false}, is_public: true},
            {'template_desks': {'$eq': []}, is_public: true}
        ];

        if (desk) {
            desk_criteria.push({'template_desks': {'$in': [desk]}, is_public: true});
        }

        criteria.$or = [{$or: desk_criteria}, {user: user, is_public: false}];

        if (type !== undefined) {
            criteria.template_type = type;
        }

        if (templateName) {
            criteria.template_name = {'$regex': templateName, '$options': '-i'};
        }

        if (!_.isEmpty(criteria)) {
            params.where = JSON.stringify({
                '$and': [criteria]
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
            where: JSON.stringify({_id: {'$in': templateIds}})
        };

        return api.query('content_templates', params)
        .then(function(result) {
            if (result && result._items) {
                result._items.sort(function(a, b) {
                    return templateIds.indexOf(a._id) - templateIds.indexOf(b._id);
                });
            }
            return result;
        });
    };

    this.isAdmin = function() {
        return session.identity.user_type === 'administrator';
    };

    this.addRecentTemplate = function(deskId, templateId) {
        return preferencesService.get()
        .then(function(result) {
            result = result || {};
            result[PREFERENCES_KEY] = result[PREFERENCES_KEY] || {};
            result[PREFERENCES_KEY][deskId] = result[PREFERENCES_KEY][deskId] || [];
            _.remove(result[PREFERENCES_KEY][deskId], function(i) {
                return i === templateId;
            });
            result[PREFERENCES_KEY][deskId].unshift(templateId);
            return preferencesService.update(result);
        });
    };

    this.getRecentTemplateIds = function(deskId, limit) {
        limit = limit || PAGE_SIZE;
        return preferencesService.get()
        .then(function(result) {
            if (result && result[PREFERENCES_KEY] && result[PREFERENCES_KEY][deskId]) {
                return _.take(result[PREFERENCES_KEY][deskId], limit);
            }
            return [];
        });
    };

    this.getRecentTemplates = function(deskId, limit) {
        limit = limit || PAGE_SIZE;
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
