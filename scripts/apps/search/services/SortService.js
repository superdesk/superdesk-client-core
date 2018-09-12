/**
 * @ngdoc service
 * @module superdesk.apps.content-api
 * @name sort
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @description Parses the $location for sort parameter and set sort parameter
 */
export class SortService {
    constructor($location) {
        this.$location = $location;
    }

    /**
     * @ngdoc method
     * @name sort#getSort
     * @public
     * @description Get the sort from url
     * @param {object} sortOptions Sort options for the different repo.
     * @return {object} sort field and direction (asc or desc)
     */
    getSort(sortOptions) {
        const sortArray = (this.$location.search().sort || 'versioncreated:desc').split(':');

        const sort = _.extend({}, _.find(sortOptions, {field: sortArray[0]}), {dir: sortArray[1]});

        if (sort.field === undefined) {
            const customFieldSort = this.$location.search().sort.split(':');


            return {field: customFieldSort[0], dir: customFieldSort[1]};
        }

        return sort;
    }

    /**
     * @ngdoc method
     * @name sort#setSort
     * @public
     * @description Set the sort
     * @param {string} field Field to sort
     * @param {object} sortOptions Sort options for the different repo.
     */
    setSort(field, sortOptions) {
        let option = _.find(sortOptions, {field: field});

        this.setSortUrlParam(option.field, option.defaultDir || 'desc');
    }

    /**
     * @ngdoc method
     * @name sort#toggleSortDir
     * @public
     * @description toggle the sort direction
     * @param {object} sortOptions Sort options for the different repo.
     */
    toggleSortDir(sortOptions) {
        let sort = this.getSort(sortOptions);
        let dir = sort.dir === 'asc' ? 'desc' : 'asc';

        this.setSortUrlParam(sort.field, dir);
    }

    /**
     * @ngdoc method
     * @name sort#formatSort
     * @public
     * @description toggle the sort direction
     * @param {string} key field to sort
     * @param {string} dir direction to sort
     * @return {string}
     */
    formatSort(key, dir) {
        let val = dir === 'asc' ? 1 : -1;

        return '[("' + encodeURIComponent(key) + '", ' + val + ')]';
    }

    /**
     * @ngdoc method
     * @name sort#setSortUrlParam
     * @public
     * @description Set the sort and page url parameter
     * @param {string} field field to sort
     * @param {string} dir direction to sort
     * @return {string}
     */
    setSortUrlParam(field, dir) {
        this.$location.search('sort', field + ':' + dir);
        this.$location.search('page', null);
    }
}

SortService.$inject = ['$location'];
