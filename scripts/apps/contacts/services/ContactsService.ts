import {get, find} from 'lodash';

import {FILTER_FIELDS, getUrlParameters} from '../constants';
import {gettext} from 'core/utils';

import {replaceUrls} from '../helpers';
import {IContactsService} from '../Contacts';
import {IContact} from 'superdesk-api';

const DEFAULT_PAGE_SIZE = 50;

/**
 * @ngdoc service
 * @module superdesk.apps.contacts
 * @name sdContactsSearch
 * @requires api
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @requires sort
 * @requires search
 * @description Handles retrieval of data from contacts api
 */
export class ContactsService implements IContactsService {
    api: any;
    $location: any;
    sort: any;
    sortOptions: any;
    search: any;
    twitterPattern: any;
    privacyOptions: any;
    statusOptions: any;
    metadata: any;

    constructor(api, $location, sort, search, metadata) {
        this.api = api;
        this.$location = $location;
        this.sort = sort;
        this.sortOptions = [
            {field: 'last_name.keyword', label: gettext('Person (Last Name)'), defaultDir: 'asc'},
            {field: 'organisation.keyword', label: gettext('Organisation'), defaultDir: 'asc'},
            {field: '_created', label: gettext('Created')},
            {field: '_updated', label: gettext('Updated')},
        ];
        this.search = search;

        this.metadata = metadata;
        this.metadata.initialize();

        this.toggleStatus = this.toggleStatus.bind(this);
        this.togglePublic = this.togglePublic.bind(this);
        this.save = this.save.bind(this);
        this.convertForClient = this.convertForClient.bind(this);

        this.twitterPattern = /^@([A-Za-z0-9_]{1,15}$)/;
        this.privacyOptions = [
            {name: gettext('All'), value: null},
            {name: gettext('Public'), value: 'true'},
            {name: gettext('Private'), value: 'false'},
        ];
        this.statusOptions = [
            {name: gettext('All'), value: null},
            {name: gettext('Active'), value: 'true'},
            {name: gettext('Inactive'), value: 'false'},
        ];
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
        let criteria: any = {};
        let params = param || this.$location.search();
        let sort = this.sort.getSort(this.sortOptions);
        let filters = [];

        criteria.max_results = DEFAULT_PAGE_SIZE;
        criteria.sort = this.sort.formatSort(sort.field, sort.dir);
        criteria.page = 1;
        criteria.all = false; // to get all contacts

        let queryParams = params.q ? [params.q] : [];

        angular.forEach(getUrlParameters(), (val, key) => {
            if (params[key]) {
                queryParams.push(`${key}:(${params[key]})`);
            }
        });

        if (queryParams.length) {
            criteria.q = queryParams.join(' ');
            criteria.default_operator = 'AND';
        }

        Object.keys(FILTER_FIELDS).forEach((key) => {
            let paramName = FILTER_FIELDS[key];

            if (angular.isDefined(params[paramName])) {
                filters.push({term: {[paramName]: params[paramName]}});
            }
        });

        if (filters.length) {
            criteria.filter = JSON.stringify({and: filters});
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
        return this.metadata.initialize()
            .then(() => this.api('contacts').query(param))
            .then((data) => {
                get(data, '_items', []).forEach(this.convertForClient);

                return data;
            });
    }

    /**
      * @ngdoc method
      * @name contacts#queryField
      * @param {string} name of field in contacts collection
      * @param {string} search text to query with in given field
      * @returns {Promise}
      * @public
      * @description Requests a list of fields value suggestions from the server e.g.,
      * in case of organisation field returns organisations suggestions if resolved.
      */
    queryField(field, text) {
        switch (field) {
        case 'organisation':
            return this.metadata.initialize()
                .then(() => this.api.get(`contacts/organisations?q=${text}`))
                .then((data) => {
                    get(data, '_items', []).forEach(this.convertForClient);

                    return data;
                });
        }
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

    save(contact, updates) {
        return this.api.save('contacts', contact, updates)
            .then(this.convertForClient);
    }

    convertForClient(response: IContact) {
        if (!response) {
            return response;
        }

        return replaceUrls(response);
    }
}

ContactsService.$inject = ['api', '$location', 'sort', 'search', 'metadata'];
