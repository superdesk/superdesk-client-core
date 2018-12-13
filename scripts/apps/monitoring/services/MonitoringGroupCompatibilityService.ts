// MonitoringGroup used to get data for hardcoded views only(monitoring, personal, spiked, search)
// In order to be able to implement custom views with custom data sources, MonitoringGroup now takes
// functions(monitoringGroupGetItem, monitoringGroupGetItems) as parameters and use those to get the data

// this file is here only to make refactoring easier
// each view will pass it's own data retrieval functions eventually and this file will be removed.

import {IUser} from "superdesk-interfaces/User";

export interface IMonitoringGroupCompatibilityService {
    initialize(): void;
    getSingleItemCompat(item, pageSize, monitoringGroup, monitoringController): any;
    getItemsCompat(
        from: number,
        pageSize: number,
        monitoringGroup,
        monitoringController,
        items: any,
        showRefresh,
        isLoadMoreCall: boolean,
        event?,
        data?: {force: boolean, items: any, item: any, item_id: string, user: IUser['_id']},
        params?,
    ): any;
}

MonitoringGroupCompatibilityService.$inject = [
    'api',
    'search',
    'multi',
    'desks',
    'cards',
];

export function MonitoringGroupCompatibilityService(
    api,
    search,
    multi,
    desks,
    cards,
): IMonitoringGroupCompatibilityService {
    var criteria;

    this.initialize = function() {
        criteria = undefined;
    };

    var projections = search.getProjectedFields();

    /**
     * Request the data on search or archive endpoints
     * return {promise} list of items
     */
    function apiquery(searchCriteria, applyProjections: boolean, monitoringGroup, pageSize) {
        var provider = 'search';

        if (monitoringGroup.type === 'search' || desks.isPublishType(monitoringGroup.type)) {
            if (searchCriteria.repo && searchCriteria.repo.indexOf(',') === -1) {
                provider = searchCriteria.repo;
                if (!angular.isDefined(searchCriteria.source.size)) {
                    searchCriteria.source.size = pageSize;
                }
            }
        } else {
            provider = 'archive';
        }

        if (applyProjections) {
            searchCriteria.projections = JSON.stringify(projections);
        }

        return api.query(provider, searchCriteria);
    }

    this.getSingleItemCompat = function(item, pageSize, monitoringGroup, monitoringController) {
        criteria = cards.criteria(monitoringGroup, null, monitoringController.queryParam);
        let previewCriteria = search.getSingleItemCriteria(item, criteria);

        return apiquery(previewCriteria, false, monitoringGroup, 1)
            .then((res) => {
                // Reset to get bulk query items
                criteria = cards.criteria(monitoringGroup, null, monitoringController.queryParam);
                criteria.source.size = pageSize;

                return res;
            });
    };

    this.getItemsCompat = function(
        from: number,
        pageSize: number,
        monitoringGroup,
        monitoringController,
        items: any,
        showRefresh,
        isLoadMoreCall: boolean,
        event?,
        data?: {force: boolean, items: any, item: any, item_id: string, user: IUser['_id']},
        params?,
    ) {
        console.log('from', from, 'pagesize', pageSize);
        if (isLoadMoreCall !== true) {
            criteria = cards.criteria(monitoringGroup, null, monitoringController.queryParam);
            criteria.source.from = from;
            criteria.source.size = pageSize;
            var originalQuery;

            // when forced refresh or query then keep query size default as set PAGE_SIZE (25) above.
            // To compare current scope of items, consider fetching same number of items.
            if (!(data && data.force) && items && items._items.length > pageSize) {
                criteria.source.size = items._items.length;
                console.log('ding', criteria.source.size);
            }

            if (desks.changeDesk) {
                desks.changeDesk = false;
                monitoringController.singleGroup = null;
                multi.reset();
            }

            if (data && (data.item || data.items || data.item_id) && showRefresh && !data.force) {
                // if we know the ids of the items then try to fetch those only
                originalQuery = angular.extend({}, criteria.source.query);

                let _items = data.items || {};

                if (data.item || data.item_id) {
                    _items[data.item || data.item_id] = 1;
                }

                criteria.source.query = search.getItemQuery(_items);
            }

            if (params) {
                angular.extend(criteria, params);
            }
        }

        return apiquery(criteria, true, monitoringGroup, pageSize)
            .then((__items) => {
                if (originalQuery) {
                    criteria.source.query = originalQuery;
                }

                return __items;
            });
    };

    return this;
}
