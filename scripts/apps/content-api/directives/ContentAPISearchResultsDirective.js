import _ from 'lodash';
import {gettext} from 'core/utils';

class LinkFunction {
    constructor(contentApiSearch, search, notify, $location, scope, elem) {
        this.scope = scope;
        this.elem = elem;
        this.containerElem = elem.find('.shadow-list-holder');
        this.notify = notify;
        this.$location = $location;
        this.contentApiSearch = contentApiSearch;
        this.search = search;

        this.criteria = this.contentApiSearch.getCriteria();
        this.queryItems();
        this.scope.fetchNext = this.fetchNext.bind(this);
        this.scope.refreshList = this.refreshList.bind(this);

        // set the watch
        this.scope.$watch(() => _.omit(this.$location.search(), ['_id', 'item']),
            (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    this.scope.refreshList();
                }
            }, true);

        this.scope.$on('refresh:list', (event, group) => {
            this.scope.refreshList();
        });
    }


    /**
     * @ngdoc method
     * @name sdContentApiSearchResults#_getAggregations
     * @private
     * @description Set the aggregations args based on filters tab or not.
     */
    _getAggregations() {
        this.criteria.aggregations = this.scope.tab === 'filters' ? 1 : 0;
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearchResults#refreshList
     * @public
     * @description Refresh the search results
     */
    refreshList() {
        this.queryItems(null, {force: true});
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearchResults#queryItems
     * @public
     * @description Function for fetching the items in case of first time.
     * @return {promise}
     */
    queryItems(event, data) {
        this.criteria = this.contentApiSearch.getCriteria();
        this._getAggregations();

        return this.contentApiSearch.query(this.criteria).then((items) => {
            this.scope.$applyAsync(() => {
                this.render(items, null, data && data.force);
            });
        }, (error) => {
            this.notify.error(gettext('Failed to run the query!'));
        })
            .finally(() => {
                this.scope.loading = false;

                // update scroll position to top, when forced refresh
                if (data && data.force) {
                    this.containerElem[0].scrollTop = 0;
                }
            });
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearchResults#fetchNext
     * @public
     * @description Function for fetching next page
     */
    fetchNext() {
        this.render(null, true);
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearchResults#render
     * @public
     * @param {Array<object>} items - Array of items to display.
     * @param {boolean} next - true then fetch next page and update the existing list of items.
     * @param {boolean} force - initialize and refresh the list to display.
     * @description Fetch the items from backend and display the items.
     */
    render(items, next, force) {
        this.scope.loading = true;

        const setScopeItems = (items, force) => {
            this.scope.items = this.search.mergeItems(items, this.scope.items, next, force);
            this.scope.items._aggregations = items._aggregations;
            this.scope.total = items._meta.total;
            this.scope.loading = false;
        };

        if (items) {
            setScopeItems(items, force);
        } else if (next) {
            this.scope.loading = true;
            this.criteria.page = (this.criteria.page || 0) + 1;
            this._getAggregations();

            this.contentApiSearch.query(this.criteria)
                .then(setScopeItems)
                .finally(() => {
                    this.scope.loading = false;
                });
        }
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.content-api
 * @name sdContentApiSearchResults
 * @requires contentApiSearch
 * @requires search
 * @requires notify
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @description sd-content-api-search-results displays the search based on the change to the route.
 */
export function ContentAPISearchResultsDirective(contentApiSearch, search, notify, $location) {
    return {
        template: require('scripts/apps/content-api/views/search-results.html'),
        link: (scope, elem) => new LinkFunction(contentApiSearch, search, notify, $location, scope, elem),
    };
}

ContentAPISearchResultsDirective.$inject = ['contentApiSearch', 'search', 'notify', '$location'];
