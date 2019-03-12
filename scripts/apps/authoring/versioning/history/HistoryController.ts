import _ from 'lodash';

HistoryController.$inject = [
    '$scope',
    'desks',
    'api',
    'highlightsService',
    '$q',
    'archiveService',
    'authoringWorkspace'];

/**
 * @ngdoc controller
 * @module superdesk.apps.authoring.versioning.history
 * @name HistoryController
 * @requires $scope
 * @requires desks
 * @requires api
 * @requires highlightsService
 * @requires $q
 * @requires archiveService
 * @requires authoringWorkspace
 * @description Retrieves the history items for a given story,
 * merges with versions if need be.
 */
export function HistoryController(
    $scope,
    desks,
    api,
    highlightsService,
    $q,
    archiveService,
    authoringWorkspace) {
    $scope.highlightsById = {};
    $scope.historyItems = null;

    /**
     * @ngdoc method
     * @name HistoryController#fetchHistory
     * @description locates history items for the story. If history items do not exist or
     * they don't start from version 1 then uses versions to fill the gap
     */
    const fetchHistory = () => {
        initializeServices().then(() => {
            getHistory($scope.item)
                .then((historyItems) => {
                    let historyVersion = historyItems.length && historyItems[0].version || 200;

                    if (!historyItems.length || historyItems[0].version > 1) {
                        // no or partial history so get versions
                        archiveService.getVersions($scope.item, desks, 'operations').then((versions) => {
                            let processedVersions = versions.map(processVersion);

                            // use versions where version number is less than the history
                            $scope.historyItems = _.filter(processedVersions, (v) => v.version < historyVersion);

                            // if there's any history items then merge them
                            if (historyItems.length) {
                                $scope.historyItems = $scope.historyItems.concat(historyItems);
                            }
                        });
                    } else {
                        $scope.historyItems = historyItems;
                    }

                    // Filter out item_lock and item_unlock history entries
                    if ($scope.historyItems && $scope.historyItems.length > 0) {
                        $scope.historyItems = $scope.historyItems.filter(
                            (entry) => !entry.operation || ['item_lock', 'item_unlock'].indexOf(entry.operation) < 0,
                        );
                    }
                })
                .catch((error) => {
                    $scope.historyItems = null;
                });
        });
    };

    /**
     * @ngdoc method
     * @name HistoryController#open
     * @param {string} id - story id.
     * @description Opens the story by given id in view mode
     */
    $scope.open = (id) => {
        authoringWorkspace.edit({_id: id}, 'view');
    };

    /**
     * @ngdoc method
     * @name HistoryController#initializeServices
     * @description initializes the desks and hightlight services
     */
    const initializeServices = () => {
        let promises = [];

        promises.push(desks.initialize().then(() => {
            $scope.deskLookup = desks.deskLookup;
        }));

        promises.push(highlightsService.get().then((result) => {
            $scope.highlightsById = {};

            result._items.forEach((item) => {
                $scope.highlightsById[item._id] = item;
            });
        }));

        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name HistoryController#getHistory
     * @param {object} item - story
     * @description creates the queries for getting history items
     */
    const getHistory = (item) => {
        const criteria = {
            where: {item_id: item._id},
            max_results: 200,
            sort: '[(\'_created\', 1)]',
        };

        if (item._type === 'legal_archive') {
            return api.query('legal_archive_history', criteria)
                .then((historyItems) => {
                    historyItems._items.map(processLegalHistoryItem);
                    return historyItems._items;
                });
        }

        return api.query('archive_history', criteria)
            .then((historyItems) => {
                historyItems._items.map(processHistoryItem);
                return historyItems._items;
            });
    };

    /**
     * @ngdoc method
     * @name HistoryController#processVersion
     * @param {object} version - a version of a story
     * @description parses the version object
     */
    const processVersion = (version) => ({
        version: version._current_version,
        displayName: version.creator,
        isPublished: ['published', 'corrected', 'killed', 'recalled'].includes(version.state),
        operation: version.operation,
        item_id: version._id,
    });

    /**
     * @ngdoc method
     * @name HistoryController#processHistoryItem
     * @param {object} h - a history item of a story
     * @description parses the history item object
     */
    const processHistoryItem = (h) => {
        let historyDesk = _.get(h, 'update.task.desk');
        let historyStage = _.get(h, 'update.task.stage');

        h.displayName = h.user_id ? desks.userLookup[h.user_id].display_name : 'System';
        h.desk = historyDesk ? desks.deskLookup[historyDesk].name : null;
        h.stage = historyStage ? desks.stageLookup[historyStage].name : null;
        h.isPublished = ['publish', 'correct', 'kill', 'resend', 'takedown'].includes(h.operation);
        h.fieldsUpdated = h.update ? Object.keys(h.update).join(', ') : null;
    };

    /**
     * @ngdoc method
     * @name HistoryController#processLegalHistoryItem
     * @param {object} h - a legal history item of a story
     * @description parses the legal history item object
     */
    const processLegalHistoryItem = (h) => {
        h.displayName = h.user_id ? h.user_id : 'System';
        h.desk = _.get(h, 'update.task.desk');
        h.stage = _.get(h, 'update.task.stage');
        h.isPublished = ['publish', 'correct', 'kill', 'resend', 'takedown'].includes(h.operation);
        h.fieldsUpdated = h.update ? Object.keys(h.update).join(', ') : null;
    };

    $scope.$watchGroup(['item._id', 'item._latest_version'], fetchHistory);
}
