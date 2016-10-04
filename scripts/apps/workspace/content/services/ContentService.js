import * as constant from '../constants';

ContentService.$inject = ['api', 'superdesk', 'templates', 'desks', 'packages', 'archiveService', '$filter'];
export function ContentService(api, superdesk, templates, desks, packages, archiveService, $filter) {

    var TEXT_TYPE = 'text';

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
        return api.save('archive', data);
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
        archiveService.addTaskToArticle(item);
        return save(item).then(function(_item) {
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
        return api.query('content_types', params, !!includeDisabled).then(function(result) {
            self.types = result._items.sort(function(a, b) {
                return b.priority - a.priority; // with higher priority goes up
            });
            return self.types;
        }, function(reason) {
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
        return this.getTypes(true).then(function(profiles) {
            var lookup = {};

            profiles.forEach(function(profile) {
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
        return api.find('content_types', id);
    };

    /**
     * Get schema for given content type
     *
     * @param {Object} contentType
     * @return {Object}
     */
    this.schema = function(contentType) {
        return contentType && contentType.schema ? angular.extend({}, contentType.schema) : constant.DEFAULT_SCHEMA;
    };

    /**
     * Get editor config for given content type
     *
     * @param {Object} contentType
     * @return {Object}
     */
    this.editor = function(contentType) {
        return contentType && contentType.editor ? angular.extend({}, contentType.editor) : constant.DEFAULT_EDITOR;
    };

    /**
     * Get profiles selected for given desk
     *
     * @param {Object} desk
     * @return {Promise}
     */
    this.getDeskProfiles = function(desk) {
        return this.getTypes().then(function(profiles) {
            return !desk || _.isEmpty(desk.content_profiles) ?
                profiles :
                profiles.filter(function(profile) {
                    return desk.content_profiles[profile._id];
                }
            );
        });
    };

    this.contentProfileSchema = angular.extend({}, constant.DEFAULT_SCHEMA, constant.EXTRA_SCHEMA_FIELDS);
    this.contentProfileEditor = angular.extend({}, constant.DEFAULT_EDITOR, constant.EXTRA_EDITOR_FIELDS);
}
