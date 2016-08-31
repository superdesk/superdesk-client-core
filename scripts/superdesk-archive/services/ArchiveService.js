ArchiveService.$inject = ['desks', 'session', 'api', '$q', 'search', '$location', 'config'];
export function ArchiveService(desks, session, api, $q, search, $location, config) {
    /**
     * Adds 'task' property to the article represented by item.
     *
     * @param {Object} item
     * @param {Object} desk when passed the item will be assigned to this desk instead of user's activeDesk.
     */
    this.addTaskToArticle = function (item, desk) {
        desk = desk || desks.getCurrentDesk();
        if ((!item.task || !item.task.desk) && desk && $location.path() !== '/workspace/personal') {
            item.task = {'desk': desk._id, 'stage': desk.working_stage, 'user': session.identity._id};
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
     *  Returns the list of items having the same slugline in the last day
     *  @param {String} slugline
     *  @return {Object} the list of archive items
     */
    this.getRelatedItems = function(slugline) {
        var before24HrDateTime = moment().subtract(1, 'days').format(config.view.dateformat);
        var params = {};
        params.q = 'slugline:(' + slugline + ')';
        params.ignoreKilled = true;
        params.ignoreDigital = true;
        params.afterversioncreated = before24HrDateTime;

        var query = search.query(params);
        query.size(200);
        var criteria = query.getCriteria(true);
        criteria.repo = 'archive,published';

        return api.query('search', criteria).then(function(result) {
            return result;
        });
    };

    /**
     * Returns true if the state of the item is in one of the published states - Scheduled, Published, Corrected
     * and Killed.
     *
     * @param {Object} item
     * @return boolean if the state of the item is in one of the published states, false otherwise.
     */
    this.isPublished = function(item) {
        return _.includes(['published', 'killed', 'scheduled', 'corrected'], item.state);
    };

    /***
     * Returns version history of the item.
     *
     * @param {Object} item
     * @param {Object} desks deskService
     * @param {String} historyType one of versions, operations
     * @return list of object where each object is a version of the item
     */
    this.getVersionHistory = function(item, desks, historyType) {
        if (this.isLegal(item)) {
            return api.find('legal_archive', item._id, {version: 'all', max_results: 200})
                .then(function(result) {
                    _.each(result._items, function(version) {
                        version.desk = version.task && version.task.desk ? version.task.desk : '';
                        version.stage = version.task && version.task.stage ? version.task.stage : '';
                        version.creator = version.version_creator || version.original_creator;

                        if (version.type === 'text') {
                            version.typeName = 'Story';
                        } else {
                            version.typeName = _.capitalize(item.type);
                        }
                    });

                    if (historyType === 'versions') {
                        return $q.when(_.sortBy(_.reject(result._items, {version: 0}), '_current_version').reverse());
                    } else if (historyType === 'operations') {
                        return $q.when(_.sortBy(result._items, '_current_version'));
                    }
                });
        } else {
            return api.find('archive', item._id, {version: 'all', embedded: {user: 1}, max_results: 200})
                .then(function(result) {
                    _.each(result._items, function(version) {
                        if (version.task) {
                            if (version.task.desk) {
                                var versiondesk = desks.deskLookup[version.task.desk];
                                version.desk = versiondesk && versiondesk.name;
                            }
                            if (version.task.stage) {
                                var versionstage = desks.stageLookup[version.task.stage];
                                version.stage = versionstage && versionstage.name;
                            }
                        }
                        if (version.version_creator || version.original_creator) {
                            var versioncreator = desks.userLookup[version.version_creator || version.original_creator];
                            version.creator = versioncreator && versioncreator.display_name;
                        }

                        if (version.type === 'text') {
                            version.typeName = 'Story';
                        } else {
                            version.typeName = _.capitalize(item.type);
                        }
                    });

                    if (historyType === 'versions') {
                        return $q.when(_.sortBy(_.reject(result._items, {version: 0}), '_current_version').reverse());
                    } else if (historyType === 'operations') {
                        return $q.when(_.sortBy(result._items, '_current_version'));
                    }
                });
        }
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

        return _.max(versions, function(version) {
            return version._current_version || version.version;
        });
    };
}
