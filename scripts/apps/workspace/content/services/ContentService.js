import * as constant from '../constants';
import _ from 'lodash';

/**
 * @ngdoc service
 * @module superdesk.apps.content
 * @name content
 *
 * @requires api
 * @requires superdesk
 * @requires templates
 * @requires desks
 * @requires packages
 * @requires archiveService
 * @requires notify
 * @requires gettext
 * @requires $filter
 * @requires $q
 * @requires $rootScope
 * @requires session
 * @requires deployConfig
 *
 * @description Content Service is responsible for creating packages or content items based
 * on templates or content types.
 * Also it is responsable for managing content types.
 */
ContentService.$inject = [
    'api',
    'superdesk',
    'templates',
    'desks',
    'packages',
    'archiveService',
    'notify',
    'gettext',
    '$filter',
    '$q',
    '$rootScope',
    'session',
    'deployConfig'
];
export function ContentService(api, superdesk, templates, desks, packages, archiveService, notify, gettext,
    $filter, $q, $rootScope, session, deployConfig) {
    const TEXT_TYPE = 'text';

    const self = this;

    function newItem(type) {
        return {
            type: type || TEXT_TYPE,
            version: 0
        };
    }

    /**
     * Save data to content api
     *
     * @param {Object} data
     * @return {Promise}
     */
    function save(data) {
        return api.save('archive', data).catch((reason) => {
            if (reason.status === 403) {
                if (_.get(reason, 'data.error.readonly')) {
                    notify.error(gettext('You are not allowed to create article on readonly stage.'));
                } else {
                    notify.error(gettext('You are not allowed to create an article there.'));
                }
            }

            return $q.reject(reason);
        });
    }

    /**
     * Create an item of given type
     *
     * @param {string} type
     * @return {Promise}
     */
    this.createItem = function(type) {
        var item = newItem(type);

        archiveService.addTaskToArticle(item);
        return save(item);
    };

    /**
     * Create a package containing given item
     *
     * @param {Object} item
     * @return {Promise}
     */
    this.createPackageItem = function(item) {
        var data = item ? {items: [item]} : {};

        return packages.createEmptyPackage(data);
    };

    /**
     * Create a package containing given item
     *
     * @param {Object} item
     * @return {Promise}
     */
    this.createPackageFromItems = function(item) {
        return packages.createPackageFromItems([item]);
    };

    /**
     * Create new item using given template
     *
     * @param {Object} template
     * @return {Promise}
     */
    this.createItemFromTemplate = function(template) {
        var item = newItem(template.data.type || null);

        angular.extend(item, templates.pickItemData(template.data || {}), {template: template._id});
        // set the dateline date to default utc date.
        if (item.dateline && item.dateline.located) {
            item.dateline = _.omit(item.dateline, 'text');
            item.dateline.date = $filter('formatDateTimeString')();
        }
        // set missing byline from user profile.
        if (!item.byline) {
            item.byline = session.identity.byline;
        }

        archiveService.addTaskToArticle(item);
        return save(item).then((_item) => {
            templates.addRecentTemplate(desks.activeDeskId, template._id);
            return _item;
        });
    };

    /**
     * Create new item using given content type
     *
     * @param {Object} contentType
     * @return {Promise}
     */
    this.createItemFromContentType = function(contentType) {
        var item = {
            type: TEXT_TYPE,
            profile: contentType._id,
            version: 0
        };

        archiveService.addTaskToArticle(item);

        return save(item);
    };

    /**
     * Creates a new content profile.
     *
     * @param {Object} data
     * @return {Promise}
     */
    this.createProfile = function(data) {
        return api.save('content_types', data);
    };

    /**
     * Creates a new content profile.
     *
     * @param {Object} item
     * @param {Object} updates
     * @return {Promise}
     */
    this.updateProfile = function(item, updates) {
        return api.update('content_types', item, updates);
    };

    /**
     * Creates a new content profile.
     *
     * @param {Object} item
     * @return {Promise}
     */
    this.removeProfile = function(item) {
        return api.remove(item, {}, 'content_types');
    };

    /**
     * Get content types from server
     *
     * @param {Boolean} includeDisabled
     * @return {Promise}
     */
    this.getTypes = function(includeDisabled) {
        var self = this;
        var params = {};

        if (!includeDisabled) {
            params = {where: {enabled: true}};
        }

        // cache when fetching all types
        return api.getAll('content_types', params, !!includeDisabled).then((result) => {
            self.types = result.sort((a, b) => b.priority - a.priority // with higher priority goes up
            );
            return self.types;
        }, (reason) => {
            self.types = [];
            return self.types;
        });
    };

    /**
     * Get types lookup
     *
     * @return {Promise}
     */
    this.getTypesLookup = function() {
        return this.getTypes(true).then((profiles) => {
            var lookup = {};

            profiles.forEach((profile) => {
                lookup[profile._id] = profile;
            });

            return lookup;
        });
    };

    /**
     * Get content type by id
     *
     * @param {string} id
     * @return {Promise}
     */
    this.getType = function(id) {
        return getCustomFields()
            .then(() => api.find('content_types', id));
    };

    /**
     * Get content type with metadata by id
     *
     * @param {string} id
     * @return {Promise}
     */
    this.getTypeMetadata = function(id) {
        return getCustomFields()
            .then(() => api.find('content_types', id, {edit: true}));
    };

    /**
     * Get schema for given profile/content type
     *
     * @param {Object} profile
     * @param {String} contentType
     * @return {Object}
     */
    this.schema = function(profile, contentType) {
        const schema = _.get(profile, 'schema',
            _.get(deployConfig.getSync('schema'), contentType, constant.DEFAULT_SCHEMA));

        return angular.extend({}, schema);
    };

    /**
     * Get editor config for given profile/ content type
     *
     * @param {Object} profile
     * @param {String} contentType
     * @return {Object}
     */
    this.editor = function(profile, contentType) {
        const editor = _.get(profile, 'editor',
            _.get(deployConfig.getSync('editor'), contentType, constant.DEFAULT_EDITOR));

        return angular.extend({}, editor);
    };

    /**
     * Get custom fields enabled in given profile
     *
     * @param {Object} profile
     * @return {Array}
     */
    this.fields = (contentType) => {
        const editor = contentType.editor || {};

        return this._fields.filter((field) => !!editor[field._id]);
    };

    /**
     * Get all custom fields
     *
     * @return {Array}
     */
    this.allFields = () => this._fields;

    /**
     * Get profiles selected for given desk
     *
     * @param {Object} desk
     * @param {string} profileId if profileId is set add such profile to the list
     * @return {Promise}
     */
    this.getDeskProfiles = function(desk, profileId) {
        return this.getTypes().then((profiles) => !desk || _.isEmpty(desk.content_profiles) ?
            profiles :
            profiles.filter((profile) => desk.content_profiles[profile._id] || profile._id === profileId)
        );
    };

    this.contentProfileSchema = angular.extend({}, constant.DEFAULT_SCHEMA, constant.EXTRA_SCHEMA_FIELDS);
    this.contentProfileEditor = angular.extend({}, constant.DEFAULT_EDITOR, constant.EXTRA_EDITOR_FIELDS);

    $rootScope.$on('vocabularies:updated', resetFields);

    /**
     * Fetch custom fields
     *
     * this is called before getting type info so it's ready for use
     */
    function getCustomFields() {
        if (self._fields) {
            return $q.when(self._fields);
        }

        if (!self._fieldsPromise) {
            self._fieldsPromise = api.getAll('vocabularies', {
                where: {
                    $or: [
                        {field_type: {$in: ['text', 'date', 'media', 'embed']}},
                        {service: {$exists: true}}
                    ]
                }
            })
                .then((response) => {
                    self._fields = response;
                    self._fieldsPromise = null;
                    return self._fields;
                });
        }

        return self._fieldsPromise;
    }

    /**
     * Reset custom fields info
     */
    function resetFields() {
        self._fields = null;
        self._fieldsPromise = null;
    }
}
