
class LinkFunction {
    constructor($location, scope, elem) {
        this.scope = scope;
        this.elem = elem;
        this.scope.repo = {search: 'content-api'};
        this.scope.tab = 'parameters';
        this.$location = $location;
        this.scope.searchItems = this.search.bind(this);
        this.scope.clear = this.clear.bind(this);
        this.scope.$watch('tab', (newVal, oldVal) => {
            if (newVal === 'filters') {
                this.scope.$broadcast('refresh:list');
            }
        });
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearchPanel#search
     * @description broadcast 'search:parameters' event to trigger search.
     */
    search() {
        this.scope.$broadcast('search:parameters');
    }

    /**
     * @ngdoc method
     * @name sdContentApiSearchPanel#clear
     * @description clear all search and refresh the results.
     */
    clear() {
        this.$location.search({});
        this.scope.$broadcast('tag:removed');
    }
}


/**
 * @ngdoc directive
 * @module superdesk.apps.content-api
 * @name sdContentApiSearchPanel
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @description sd-content-api-search-panel operates the search panel that appears
 * to the left of the content-api search page
 */
export function ContentAPISearchPanelDirective($location) {
    return {
        template: require('scripts/apps/content-api/views/search-panel.html'),
        link: (scope, elem) => new LinkFunction($location, scope, elem),
    };
}

ContentAPISearchPanelDirective.$inject = ['$location'];
