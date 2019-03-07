import {BaseSortBar} from 'apps/search/directives/BaseSortBar';

class LinkFunction extends BaseSortBar {
    contentApiSearch: any;

    constructor(contentApiSearch, sort, scope, elem) {
        super(scope, elem, sort);
        this.contentApiSearch = contentApiSearch;
        this.scope.canSort = super.canSort.bind(this);
        this.scope.sortOptions = contentApiSearch.sortOptions;
        super.getActive();
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.content-api
 * @name sdContentApiSortBar
 * @requires contentApiSearch
 * @requires sort
 * @description sd-content-api-sort-bar handle sort functionality.
 */
export function ContentAPISortBarDirective(contentApiSearch, sort) {
    return {
        scope: {total: '='},
        template: require('apps/search/views/item-sortbar.html'),
        link: (scope, elem) => new LinkFunction(contentApiSearch, sort, scope, elem),
    };
}

ContentAPISortBarDirective.$inject = ['contentApiSearch', 'sort'];
