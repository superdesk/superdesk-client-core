import _ from 'lodash';
import {isPublished} from 'apps/archive/utils';
import {assertNever} from 'core/helpers/typescript-helpers';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import ng from 'core/services/ng';
import {IArticle, IBaseRestApiResponse} from 'superdesk-api';
import {gettext} from 'core/utils';

HistoryController.$inject = [
    '$scope',
    'desks',
    'api',
    'highlightsService',
    '$q',
    'archiveService',
    'authoringWorkspace',
];

export type PublishType = 'publish' | 'kill' | 'correct' | 'takedown' | 'resend' | 'unpublish';

export function isPublishType(x: unknown): x is PublishType {
    return x === 'publish'
        || x === 'kill'
        || x === 'correct'
        || x === 'takedown'
        || x === 'resend'
        || x === 'unpublish';
}

/**
 * @ngdoc method
 * @name HistoryController#processVersion
 * @param {object} version - a version of a story
 * @description parses the version object
 */
const processVersion = (version) => ({
    version: version._current_version,
    displayName: version.creator,
    isPublished: isPublished(version, false),
    operation: version.operation,
    item_id: version._id,
});

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

/**
 * @ngdoc method
 * @name HistoryController#processHistoryItem
 * @param {object} h - a history item of a story
 * @description parses the history item object
 */
const processHistoryItem = (h) => {
    const desks = ng.get('desks');

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
 * @name HistoryController#getHistory
 * @param {object} item - story
 * @description creates the queries for getting history items
 */
const getHistory = (item) => {
    const api = ng.get('api');

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

export interface IHistoryItem extends IBaseRestApiResponse {
    item_id?: string;
    operation?: string;
    desk?: string; // desk display name
    stage?: string; // stage display name
    displayName?: string; // user display name
    fieldsUpdated?: string;
    version?: number;
    update?: {
        operation?: string;
        duplicate_id?: string;
        highlight_id?: string;
        linked_to?: string;
        rewrite_of?: string;
        rewritten_by?: string;
        highlight_name?: string;
        state?: any;
        desk_id: string;
    };
}

export function getHistoryItems(item: IArticle): Promise<Array<IHistoryItem>> {
    let historyItemsResult = [];
    const archiveService = ng.get('archiveService');
    const desks = ng.get('desks');

    return new Promise((resolve, reject) => {
        getHistory(item)
            .then((historyItems) => {
                let historyVersion = historyItems.length && historyItems[0].version || 200;

                if (!historyItems.length || historyItems[0].version > 1) {
                    // no or partial history so get versions
                    archiveService.getVersions(item, desks, 'operations').then((versions) => {
                        let processedVersions = versions.map(processVersion);

                        // use versions where version number is less than the history
                        historyItemsResult = _.filter(processedVersions, (v) => v.version < historyVersion);

                        // if there's any history items then merge them
                        if (historyItems.length) {
                            historyItemsResult = historyItemsResult.concat(historyItems);
                        }
                    });
                } else {
                    historyItemsResult = historyItems;
                }

                // Filter out item_lock and item_unlock history entries
                if (historyItemsResult && historyItemsResult.length > 0) {
                    historyItemsResult = historyItemsResult.filter(
                        (entry) => !entry.operation || ['item_lock', 'item_unlock'].indexOf(entry.operation) < 0,
                    );
                }

                resolve(historyItemsResult);
            })
            .catch(() => {
                reject(null);
            });
    });
}

export function getOperationLabel(operation: PublishType, state: string): string {
    switch (operation) {
    case 'publish':
        return state === 'scheduled' ? gettext('Scheduled by') : gettext('Published by');
    case 'correct':
        return gettext('Corrected by');
    case 'kill':
        return gettext('Killed by');
    case 'takedown':
        return gettext('Recalled by');
    case 'resend':
        return gettext('Resent by');
    case 'unpublish':
        return gettext('Unpublished by');
    default:
        assertNever(operation);
    }
}

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
    authoringWorkspace: AuthoringWorkspaceService,
) {
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
            getHistoryItems($scope.item).then((result) => {
                $scope.historyItems = result;
                $scope.$applyAsync();
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

    $scope.$watchGroup(['item._id', 'item._latest_version'], fetchHistory);

    $scope.getOperationLabel = getOperationLabel;
}
