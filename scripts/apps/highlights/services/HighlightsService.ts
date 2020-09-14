import _ from 'lodash';
import {gettext} from 'core/utils';
import {IPackagesService} from 'types/Services/Packages';

/**
 * Service for highlights with caching.
 */
HighlightsService.$inject = ['api', '$q', '$cacheFactory', 'packages', 'privileges'];
export function HighlightsService(api, $q, $cacheFactory, packages: IPackagesService, privileges) {
    var service: any = {};
    var promise = {};
    var cache = $cacheFactory('highlightList');

    /**
     * Get cached value for given key
     *
     * @param {string} key
     * @return {Object}
     */
    service.getSync = function(key) {
        return cache.get(key);
    };

    /**
     * Fetches and caches highlights, or returns from the cache.
     */
    service.get = function(desk) {
        var DEFAULT_CACHE_KEY = '_nodesk';
        var key = desk || DEFAULT_CACHE_KEY;
        var value = service.getSync(key);

        if (value) {
            return $q.when(value);
        } else if (promise[key]) {
            return promise[key];
        }

        var criteria = {};

        if (desk) {
            criteria = {where: {$or: [
                {desks: desk},
                {desks: {$size: 0}},
            ],
            },
            };
        }

        promise[key] = api('highlights').query(criteria)
            .then((result) => {
                result._items = _.sortBy(result._items, (i) => i.name.toLowerCase());
                setLabel(result._items);
                cache.put(key, result);
                promise[key] = null;
                return $q.when(result);
            });

        return promise[key];
    };

    function setLabel(objItems) {
        _.forEach(objItems, (item) => {
            item.label = item.desks.length ? item.name : item.name + ' ' + gettext('(Global)');
        });
    }

    /**
     * Clear user cache
     */
    service.clearCache = function() {
        cache.removeAll();
        promise = {};
    };

    /**
     * Saves highlight configuration
     */
    service.saveConfig = function(config, configEdit) {
        return api.highlights.save(config, configEdit).then((item) => {
            service.clearCache();
            return item;
        });
    };

    /**
     * Removes highlight configuration
     */
    service.removeConfig = function(config) {
        return api.highlights.remove(config).then(() => {
            service.clearCache();
        });
    };

    /**
     * Mark an item for a highlight
     */
    service.markItem = function(highlight, markedItem) {
        return api.save('marked_for_highlights', {highlights: highlight, marked_item: markedItem._id});
    };

    /**
     * Create empty highlight package
     */
    service.createEmptyHighlight = function(highlight) {
        var pkgDefaults: any = {
            headline: highlight.name,
            highlight: highlight._id,
        };

        var group = null;

        if (highlight.groups && highlight.groups.length > 0) {
            group = highlight.groups[0];
        }
        if (highlight.task) {
            pkgDefaults.task = highlight.task;
        }

        return packages.createEmptyPackage(pkgDefaults, null, group, null);
    };

    /**
     * Get single highlight by its id
     *
     * @param {string} _id
     * @return {Promise}
     */
    service.find = function(_id) {
        return api.find('highlights', _id);
    };

    service.hasMarkItemPrivilege = function() {
        return !!privileges.privileges.mark_for_highlights;
    };

    /**
     * Checks if the hourDifference falls in the
     * defined range in highlight
     *
     * @param {string} highlight id
     * @param {int} hourDifference
     * @return {bool}
     */
    service.isInDateRange = function(highlight, hourDifference) {
        if (highlight) {
            if (highlight.auto_insert === 'now/d') {
                return hourDifference <= 24;
            } else if (highlight.auto_insert === 'now/w') {
                return hourDifference <= 168; // 24*7
            } else if (_.startsWith(highlight.auto_insert, 'now-')) {
                var trimmedValue = _.trimStart(highlight.auto_insert, 'now-');

                trimmedValue = _.trimEnd(trimmedValue, 'h');
                return hourDifference <= _.parseInt(trimmedValue);
            }
        }

        // If non matches then return false
        return false;
    };

    return service;
}
