import * as constant from '../constants';
import {get, omit, isEmpty, zipObject} from 'lodash';
import {gettext} from 'core/utils';
import {isMediaEditable} from 'core/config';
import {IArticle} from 'superdesk-api';

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
    '$filter',
    '$q',
    '$rootScope',
    'session',
    'deployConfig',
    'send',
    'config',
    'renditions',
];
export function ContentService(api, superdesk, templates, desks, packages, archiveService, notify,
    $filter, $q, $rootScope, session, deployConfig, send, config, renditions) {
    const TEXT_TYPE = 'text';

    const self = this;

    function newItem(type) {
        return {
            type: type || TEXT_TYPE,
            version: 0,
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
                if (get(reason, 'data.error.readonly')) {
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
        var item: any = newItem(template.data.type || null);

        angular.extend(item, templates.pickItemData(template.data || {}), {template: template._id});
        // set the dateline date to default utc date.
        if (item.dateline && item.dateline.located) {
            item.dateline = omit(item.dateline, 'text');
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
            version: 0,
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
        // eslint-disable-next-line consistent-this
        var getTypesFnThis = this;
        var params = {};

        if (!includeDisabled) {
            params = {where: {enabled: true}};
        }

        // cache when fetching all types
        return api.getAll('content_types', params, !!includeDisabled).then((result) => {
            getTypesFnThis.types = result.sort((a, b) => b.priority - a.priority, // with higher priority goes up
            );
            return getTypesFnThis.types;
        }, (reason) => {
            getTypesFnThis.types = [];
            return getTypesFnThis.types;
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
        const schema = get(profile, 'schema',
            get(deployConfig.getSync('schema'), contentType, constant.DEFAULT_SCHEMA));

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
        const editor = get(profile, 'editor',
            get(deployConfig.getSync('editor'), contentType, constant.DEFAULT_EDITOR));

        return angular.extend({}, editor);
    };

    /**
     * Get custom fields enabled in given profile
     *
     * @param {Object} profile
     * @return {Array}
     */
    this.fields = (profile) => {
        const editor = profile.editor || {};

        return this._fields ? this._fields.filter((field) => !!editor[field._id]) : [];
    };

    /**
     * Get profiles selected for given desk
     *
     * @param {Object} desk
     * @param {string} profileId if profileId is set add such profile to the list
     * @return {Promise}
     */
    this.getDeskProfiles = function(desk, profileId) {
        return this.getTypes().then((profiles) => !desk || isEmpty(desk.content_profiles) ?
            profiles :
            profiles.filter((profile) => desk.content_profiles[profile._id] || profile._id === profileId),
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
                        {field_type: {$in: constant.CUSTOM_FIELD_TYPES}},
                        {service: {$exists: true}},
                    ],
                },
            })
                .then((response) => {
                    self._fields = response;
                    self._fieldsPromise = null;
                    return self._fields;
                });
        }

        return self._fieldsPromise;
    }

    this.getCustomFields = getCustomFields;

    this.fetchAssociations = (item) => {
        const associations = item.associations || {};
        const keys = Object.keys(associations);

        return Promise.all(keys.map((key) => {
            // there is only _id, maybe _type for related items
            if (associations[key] && Object.keys(associations[key]).length <= 2) {
                return api.find('archive', associations[key]._id);
            }

            return Promise.resolve(associations[key]);
        })).then((values) => zipObject(keys, values));
    };

    /**
     * Reset custom fields info
     */
    function resetFields() {
        self._fields = null;
        self._fieldsPromise = null;
    }

    /**
     * Handle drop event transfer data and convert it to an item
     */
    this.dropItem = (item: IArticle, {fetchExternal} = {fetchExternal: true}) => {
        if (item._type !== 'externalsource') {
            if (item._type === 'ingest') {
                return send.one(item);
            }

            if (item.archive_item != null) {
                return $q.when(item.archive_item);
            }

            return api.find(item._type, item._id);
        } else if (isMediaEditable(config) && fetchExternal) {
            return renditions.ingest(item);
        }

        return $q.when(item);
    };

    /**
     * Setup authoring scope for item
     */
    this.setupAuthoring = (profileId, scope, item) => {
        if (profileId) {
            return this.getType(profileId).then((profile) => {
                scope.schema = this.schema(profile, item.type);
                scope.editor = this.editor(profile, item.type);
                scope.fields = this.fields(profile);
                return profile;
            });
        } else {
            return this.getCustomFields().then(() => {
                scope.schema = this.schema(null, get(item, 'type', 'text'));
                scope.editor = this.editor(null, get(item, 'type', 'text'));
                scope.fields = this.fields({editor: scope.editor});
            });
        }
    };
}
