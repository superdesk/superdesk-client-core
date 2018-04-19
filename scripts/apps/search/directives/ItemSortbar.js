import {BaseSortBar} from './BaseSortBar';

class LinkFunction extends BaseSortBar {
    constructor(search, $location, sort, scope, elem) {
        super(scope, elem, sort);
        this.search = search;
        this.$location = $location;
        this.scope.canSort = this.canSort.bind(this);
        this.scope.sortOptions = search.sortOptions;
        this.repos = {
            aapmm: true,
            paimg: true,
            // temporaty fix to have several scanpix instances (SDNTB-217)
            // FIXME: need to be refactored (SD-4448)
            'scanpix(ntbtema)': true,
            'scanpix(ntbkultur)': true,
            'scanpix(desk)': true,
            'scanpix(npk)': true,
        };

        super.getActive();
    }

    /**
     * @ngdoc method
     * @name sdItemSortbar#canSort
     * @public
     * @description check if sort is available or not
     * @return {boolean}
     */
    canSort() {
        let criteria = this.search.query(this.$location.search()).getCriteria(true);

        return !(angular.isDefined(criteria.repo) && this.repos[criteria.repo]);
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.content-api
 * @name sd-item-sortbar
 * @requires search
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires sort
 * @description sd-item-sortbar handle the sort functi0nality
 */
export function ItemSortbar(search, $location, sort) {
    return {
        scope: {total: '='},
        template: require('apps/search/views/item-sortbar.html'),
        link: (scope, elem) => new LinkFunction(search, $location, sort, scope, elem),
    };
}

ItemSortbar.$inject = ['search', '$location', 'sort'];
