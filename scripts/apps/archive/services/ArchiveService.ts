import _ from 'lodash';
import moment from 'moment';

ArchiveService.$inject = ['desks', 'session', 'api', '$q', 'search', '$location', 'config'];
export function ArchiveService(desks, session, api, $q, search, $location, config) {
    /**
     * Adds 'task' property to the article represented by item.
     *
     * @param {Object} item
     * @param {Object} desk when passed the item will be assigned to this desk instead of user's activeDesk.
     */
    this.addTaskToArticle = function(item, desk = desks.getCurrentDesk()) {
        if ((!item.task || !item.task.desk) && desk && $location.path() !== '/workspace/personal') {
            item.task = {desk: desk._id, stage: desk.working_stage, user: session.identity._id};
        }
    };

    /**
     * Returns the _type aka repository of the item.
     *
     * @param {Object} item
     * @return String
     *      'ingest' if the state of the item is Ingested
     *      'spike' if the state of the item is Spiked
     *      'archived' if item is archived (no post publish actions)
     *      'archive' if none of the above is returned
     */
    this.getType = function(item) {
        var itemType;

        if (this.isLegal(item)) {
            itemType = item._type;
        } else if (this.isArchived(item)) {
            itemType = 'archived';
        } else if (item._type === 'externalsource') {
            itemType = 'externalsource';
        } else if (item.state === 'spiked') {
            itemType = 'spike';
        } else if (item.state === 'ingested') {
            itemType = 'ingest';
        } else {
            itemType = 'archive';
        }

        return itemType;
    };

    /**
     * Returns true if the item is fetched from Legal Archive
     *
     * @param {Object} item
     * @return boolean if the item is fetched from Legal Archive, false otherwise.
     */
    this.isLegal = function(item) {
        return item._type === 'legal_archive';
    };

    /**
     * Returns true if the item is fetched from Archived
     *
     * @param {Object} item
     * @return boolean if the item is fetched from Archived, false otherwise.
     */
    this.isArchived = function(item) {
        return item._type === 'archived';
    };

    /**
     * Returns true if the item is in personal workspace
     *
     * @param {Object} item
     * @return boolean
     */
    this.isPersonal = (item) => item.task && item.task.user && !item.task.desk;

    /**
     *  Returns the list of items having the same slugline, type and genre from midnight onwards.
     *  @param {Object} item
     *  @param {Datetime} fromDateTime - from datetime
     *  @return {Object} the list of archive items
     */
    this.getRelatedItems = function(item, fromDateTime) {
        var beforeDateTime = fromDateTime || moment().subtract(1, 'days')
            .format(config.view.dateformat);
        var params: any = {};

        params.q = 'slugline.phrase:"' + _.trim(item.slugline) + '"'; // exact match
        params.ignoreKilled = true;
        params.ignoreDigital = true;
        params.versioncreatedfrom = beforeDateTime;

        var query = search.query(params);

        query.size(200);

        if (_.get(item, '_id')) {
            let filter: any = {
                bool: {
                    must_not: [
                        {bool: {must: [{term: {_id: item._id}}, {term: {_type: 'archive'}}]}},
                        {bool: {must: [{term: {item_id: item._id}}, {term: {_type: 'published'}}]}},
                    ],
                    must: [{term: {type: item.type}}],
                },
            };

            if (_.get(item, 'genre[0].qcode')) {
                filter.bool.must.push({term: {'genre.qcode': _.get(item, 'genre[0].qcode')}});
            }

            query.filter(filter);
        }

        var criteria = query.getCriteria(true);

        criteria.repo = 'archive,published';

        return api.query('search', criteria).then((result) => result);
    };

    /**
     * Returns true if the state of the item is in one of the published states - Scheduled, Published, Corrected
     * and Killed.
     *
     * @param {Object} item
     * @return boolean if the state of the item is in one of the published states, false otherwise.
     */
    this.isPublished = function(item) {
        return _.includes(['published', 'killed', 'scheduled', 'corrected', 'recalled'], item.state);
    };

    /** *
     * Returns versions of the item.
     *
     * @param {Object} item
     * @param {Object} deskService
     * @param {String} versionType one of versions, operations
     * @return list of object where each object is a version of the item
     */
    this.getVersions = function(item, deskService, versionType) {
        if (this.isLegal(item)) {
            return api.find('legal_archive', item._id, {version: 'all', max_results: 200})
                .then((result) => {
                    _.each(result._items, (version) => {
                        version.desk = version.task && version.task.desk ? version.task.desk : '';
                        version.stage = version.task && version.task.stage ? version.task.stage : '';
                        version.creator = version.version_creator || version.original_creator;

                        if (version.type === 'text') {
                            version.typeName = 'Story';
                        } else {
                            version.typeName = _.capitalize(item.type);
                        }
                    });

                    if (versionType === 'versions') {
                        return $q.when(_.sortBy(_.reject(result._items, {version: 0}), '_current_version').reverse());
                    } else if (versionType === 'operations') {
                        return $q.when(_.sortBy(result._items, '_current_version'));
                    }
                });
        }

        return api.find('archive', item._id, {version: 'all', embedded: {user: 1}, max_results: 200})
            .then((result) => {
                _.each(result._items, (version) => {
                    if (version.task) {
                        if (version.task.desk) {
                            var versiondesk = deskService.deskLookup[version.task.desk];

                            version.desk = versiondesk && versiondesk.name;
                        }
                        if (version.task.stage) {
                            var versionstage = deskService.stageLookup[version.task.stage];

                            version.stage = versionstage && versionstage.name;
                        }
                    }
                    if (version.version_creator || version.original_creator) {
                        var versioncreator =
                            deskService.userLookup[version.version_creator || version.original_creator];

                        version.creator = versioncreator && versioncreator.display_name || 'System';
                    }

                    if (version.type === 'text') {
                        version.typeName = 'Story';
                    } else {
                        version.typeName = _.capitalize(item.type);
                    }
                });

                if (versionType === 'versions') {
                    return $q.when(_.sortBy(_.reject(result._items, {version: 0}), '_current_version').reverse());
                } else if (versionType === 'operations') {
                    return $q.when(_.sortBy(result._items, '_current_version'));
                }
            });
    };

    /**
     * Get latest version from the list
     *
     * @param {Object} item
     * @param {Object} versions
     * @return last version of the item
     */
    this.lastVersion = function(item, versions) {
        if (item._latest_version) {
            return _.find(versions, {_current_version: item._latest_version});
        }

        const versionsMap = versions.map((v) => v._current_version || v.version);

        return _.max(versionsMap);
    };
}
