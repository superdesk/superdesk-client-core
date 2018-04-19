const DEFAULT_PAGE_SIZE = 25;

/**
 * @ngdoc service
 * @module superdesk.apps.contacts
 * @name sdContactsSearch
 * @requires api
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires sort
 * @requires search
 * @requires gettext
 * @description Handles retrieval of data from contacts api
 */
export class ContactsService {
    constructor(api, $location, sort, search, gettext) {
        this.api = api;
        this.$location = $location;
        this.sort = sort;
        this.sortOptions = [
            {field: 'last_name', label: gettext('Person (Last Name)'), defaultDir: 'asc'},
            {field: 'organisation', label: gettext('Organisation'), defaultDir: 'asc'},
            {field: '_created', label: gettext('Created')},
            {field: '_updated', label: gettext('Updated')},
        ];
        this.search = search;
        this.toggleStatus = this.toggleStatus.bind(this);
        this.togglePublic = this.togglePublic.bind(this);
        this.save = this.save.bind(this);

        this.twitterPattern = /^@([A-Za-z0-9_]{1,15}$)/;
    }

    /**
     * @ngdoc method
     * @name contacts#getCriteria
     * @public
     * @description Get the search criteria for given params.
     * @param {object} param $location.search object
     * @return {object}
     */
    getCriteria(param) {
        let criteria = {};
        let params = param || this.$location.search();
        let sort = this.sort.getSort(this.sortOptions);

        criteria.max_results = DEFAULT_PAGE_SIZE;
        criteria.sort = this.sort.formatSort(sort.field, sort.dir);
        criteria.page = 1;
        criteria.all = true;

        if (params.q) {
            criteria.q = params.q;
            criteria.default_operator = 'AND';
        }

        return criteria;
    }

    /**
     * @ngdoc method
     * @name contacts#query
     * @public
     * @description Calls contacts api and performs the query.
     * @param {object} param parameters to query
     * @return {promise}
     */
    query(param) {
        return this.api('contacts').query(param);
    }

    /* Contact Form */

    /**
     * Toggle contact status
     */
    toggleStatus(contact, active) {
        return this.api.save('contacts', {is_active: active});
    }

    togglePublic(contact, isPublic) {
        return this.api.save('contacts', {public: isPublic});
    }

    save(contact, data) {
        return this.api.save('contacts', contact, data);
    }
}

ContactsService.$inject = ['api', '$location', 'sort', 'search', 'gettext'];
