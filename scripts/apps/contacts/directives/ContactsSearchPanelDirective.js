class LinkFunction {
    constructor($location, scope, elem) {
        this.scope = scope;
        this.elem = elem;

        this.$location = $location;
        this.scope.searchItems = this.search.bind(this);
        this.scope.clear = this.clear.bind(this);
        this.getQuery = this.getQuery.bind(this);
        this.searchParameters = this.searchParameters.bind(this);

        this.scope.toggle = {all: true};

        this.scope.keyPressed = this.keyPressed.bind(this);

        this.init();

        this.scope.$on('$locationChangeSuccess', () => {
            if (this.scope.query !== this.$location.search().q) {
                this.init();
            }
        });
    }

    /*
     * init function to setup the directive initial state and called by $locationChangeSuccess event
     * @param {boolean} loadData.
     */
    init() {
        var params = this.$location.search();

        this.scope.query = params.q;
        this.scope.flags = false;
        this.scope.meta = {};
    }

    /*
     * Get Query function build the query string
     */
    getQuery() {
        var metas = [];
        var pattern = /[()]/g;
        const getFirstKey = function(data) {
            for (var prop in data) {
                if (data.hasOwnProperty(prop)) {
                    return prop;
                }
            }
        };
        const booleanToBinaryString = function(bool) {
            return Number(bool).toString();
        };

        angular.forEach(this.scope.meta, (val, key) => {
            let v = val;

            if (typeof val === 'boolean') {
                v = booleanToBinaryString(val);
            }

            if (typeof val === 'string') {
                v = val.replace(pattern, '');
            }

            if (key === '_all') {
                metas.push(v.join(' '));
            } else if (v) {
                let k = key;

                if (typeof v === 'string') {
                    if (v) {
                        metas.push(k + ':(' + v + ')');
                    }
                } else if (angular.isArray(v)) {
                    angular.forEach(v, (value) => {
                        metas.push(k + ':(' + value.replace(pattern, '') + ')');
                    });
                } else {
                    var subkey = getFirstKey(v);

                    if (v[subkey]) {
                        metas.push(k + '.' + subkey + ':(' + v[subkey] + ')');
                    }
                }
            }
        });

        if (metas.length) {
            if (this.scope.query) {
                return this.scope.query + ' ' + metas.join(' ');
            }
            return metas.join(' ');
        }

        return this.scope.query || null;
    }

    searchParameters() {
        this.$location.search('q', this.getQuery() || null);
        this.scope.meta = {};
    }

    /**
     * @ngdoc method
     * @name sdContactsSearchPanel#search
     * @description function to perform search.
     */
    search() {
        this.searchParameters();
    }

    keyPressed(event) {
        const ENTER = 13;

        if (event.keyCode === ENTER) {
            this.searchParameters();
            event.preventDefault();
        }
    }

    /**
     * @ngdoc method
     * @name sdContactsSearchPanel#clear
     * @description clear all search and refresh the results.
     */
    clear() {
        this.$location.search(_.omit(this.$location.search(), 'q'));
        this.scope.$broadcast('tag:removed');
    }
}


/**
 * @ngdoc directive
 * @module superdesk.apps.contacts
 * @name sdContactsSearchPanel
 * @requires https://docs.angularjs.org/api/ng/service/$location $location
 * @description sd-contacts-search-panel operates the search panel that appears
 * to the left of the contacts search page
 */
export function ContactsSearchPanelDirective($location) {
    return {
        template: require('scripts/apps/contacts/views/search-panel.html'),
        link: (scope, elem) => new LinkFunction($location, scope, elem)
    };
}

ContactsSearchPanelDirective.$inject = ['$location'];
