import {BaseSortBar} from 'apps/search/directives/BaseSortBar';

class LinkFunction extends BaseSortBar {
    legal: any;

    constructor(legal, sort, scope, elem) {
        super(scope, elem, sort);
        this.legal = legal;
        this.scope.canSort = super.canSort.bind(this);
        this.scope.sortOptions = legal.sortOptions;
        super.getActive();
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.legal-archive
 * @name sdLegalItemSortBar
 * @requires legal
 * @requires sort
 * @description sd-legal-item-sort-bar handle sort functionality.
 */
export function LegalItemSortbar(legal, sort) {
    return {
        scope: {total: '='},
        template: require('apps/search/views/item-sortbar.html'),
        link: (scope, elem) => new LinkFunction(legal, sort, scope, elem),
    };
}

LegalItemSortbar.$inject = ['legal', 'sort'];
