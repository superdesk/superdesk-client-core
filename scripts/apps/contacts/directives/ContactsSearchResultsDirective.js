class LinkFunction {
    constructor(contacts, search, notify, gettext, $location, $timeout, scope, elem) {
        this.scope = scope;
        this.elem = elem;
        this.containerElem = elem.find('.shadow-list-holder');
        this.notify = notify;
        this.gettext = gettext;
        this.$location = $location;
        this.$timeout = $timeout;
        this.contacts = contacts;
        this.search = search;

        this.criteria = this.contacts.getCriteria();
        this.queryItems();
        this.scope.fetchNext = this.fetchNext.bind(this);
        this.scope.refreshList = this.refreshList.bind(this);

        this.scope.$watch(() => _.omit(this.$location.search(), '_id'),
            (newValue, oldValue) => {
                if (newValue !== oldValue && this.$location.path() === '/contacts') {
                    this.scope.refreshList({force: true});
                }
            }, true);

        angular.forEach(['refresh:list', 'contacts:create'], (evt) => {
            this.scope.$on(evt, (event) => {
                this.scope.refreshList({force: true});
            });
        });

        this.scope.$on('contacts:update', this.scope.refreshList);
    }


    /**
     * @ngdoc method
     * @name sdContactsSearchResults#refreshList
     * @public
     * @description Refresh the search results
     */
    refreshList(data) {
        this.$timeout(() => {
            this.queryItems(null, data);
        }, 800, false);
    }

    /**
     * @ngdoc method
     * @name sdContactsSearchResults#queryItems
     * @public
     * @description Function for fetching the items.
     * @return {promise}
     */
    queryItems(event, data) {
        this.criteria = this.contacts.getCriteria();

        if (!(data && data.force) && this.scope.items && this.scope.items._items.length > this.criteria.max_results) {
            this.criteria.max_results = this.scope.items._items.length;
        }

        return this.contacts.query(this.criteria).then((items) => {
            this.scope.$applyAsync(() => {
                this.render(items, null, data && data.force);
            });
        }, (error) => {
            this.notify.error(this.gettext('Failed to run the query!'));
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
     * @name sdContactsSearchResults#fetchNext
     * @public
     * @description Function for fetching next page
     */
    fetchNext() {
        this.render(null, true);
    }

    /**
     * @ngdoc method
     * @name sdContactsSearchResults#render
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
            this.scope.total = items._meta.total;
            this.scope.loading = false;
        };

        if (items) {
            setScopeItems(items, force);
        } else if (next) {
            this.scope.loading = true;
            this.criteria.page = (this.criteria.page || 0) + 1;

            this.contacts.query(this.criteria)
                .then(setScopeItems)
                .finally(() => {
                    this.scope.loading = false;
                });
        }
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.contacts
 * @name sdContactsSearchResults
 * @requires Contacts service
 * @requires search
 * @requires notify
 * @requires gettext
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @description sd-contacts-search-results displays the search based on the change to the route.
 */
export function ContactsSearchResultsDirective(contacts, search, notify, gettext, $location, $timeout) {
    return {
        template: require('scripts/apps/contacts/views/search-results.html'),
        link: (scope, elem) => new LinkFunction(contacts, search, notify, gettext, $location, $timeout, scope, elem)
    };
}

ContactsSearchResultsDirective.$inject = ['contacts', 'search', 'notify', 'gettext', '$location', '$timeout'];
