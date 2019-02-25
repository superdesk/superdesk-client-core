import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {URL_PARAMETERS} from '../constants';
import {SelectFieldSearchInput} from '../../contacts/components/Form';
import {gettext} from 'core/utils';


class LinkFunction {
    constructor(contacts, $location, scope, elem) {
        this.scope = scope;
        this.elem = elem;
        this.orgField = document.getElementById('org-field');
        this.contacts = contacts;
        this.$location = $location;
        this.scope.searchItems = this.search.bind(this);
        this.scope.clear = this.clear.bind(this);
        this.setQueryString = this.setQueryString.bind(this);
        this.scope.toggle = {all: true};
        this.scope.keyPressed = this.keyPressed.bind(this);
        this.scope.searchField = this.searchField.bind(this);
        this.scope.isSearchDifferent = this.isSearchDifferent.bind(this);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.init(true);

        this.scope.$on('$locationChangeSuccess', () => {
            if (this.scope.query !== this.$location.search().q || this.scope.isSearchDifferent()) {
                this.init();
            }
        });

        this.scope.$on('$destroy', () => {
            elem.off();
            ReactDOM.unmountComponentAtNode(this.orgField);
        });
    }

    /*
     * init function to setup the directive initial state and called by $locationChangeSuccess event
     */
    init() {
        var params = this.$location.search();

        this.scope.query = params.q;
        this.scope.flags = false;
        let meta = {};

        _.forEach(URL_PARAMETERS, (value, key) => {
            if (_.get(params, key)) {
                meta[key] = params[key];
            }
        });
        this.scope.meta = meta;
        this.scope.filteredList = {};
        if (!params.organisation) {
            this.scope.filteredList['organisation'] = [];
        }

        this.renderSearchField('organisation', true);
        this.scope.selectedItem = '';
    }

    isSearchDifferent() {
        let params = this.$location.search();

        return _.some(_.keys(URL_PARAMETERS), (key) => _.get(this.scope.meta, key) !== _.get(params, key));
    }

    handleOnChange(field, value) {
        this.scope.meta[field] = value;
        this.renderSearchField(field, false);
    }

    renderSearchField(field, initValue) {
        let fieldElement;
        let fieldLabel;
        let querySearch = false;

        switch (field) {
        case 'organisation':
            fieldElement = this.orgField;
            fieldLabel = gettext('Organisation');
            querySearch = true;
            break;
        }

        ReactDOM.render(
            <SelectFieldSearchInput
                field={field}
                label={fieldLabel}
                onChange={this.handleOnChange}
                value={_.get(this.scope.meta, field, '')}
                querySearch={querySearch}
                onQuerySearch={((searchText) => this.scope.searchField(field, searchText))}
                dataList={this.scope.filteredList[field]}
                initValue={initValue}
            />
            , fieldElement
        );
    }


    /**
     * @ngdoc method
     * @name sdContactsSearchPanel#setQueryString
     * @description function to set query string.
     */
    setQueryString() {
        let pattern = /[()]/g;
        let params = this.$location.search();
        const booleanToBinaryString = function(bool) {
            return Number(bool).toString();
        };

        _.forEach(this.scope.meta, (val, key) => {
            let v = val;

            if (typeof val === 'boolean') {
                v = booleanToBinaryString(val);
            }

            if (typeof val === 'string') {
                v = val.replace(pattern, '');
            }

            if (v) {
                this.$location.search(key, val);
            } else if (_.get(params, key)) {
                this.$location.search(key, null);
            }
        });

        this.$location.search('q', this.scope.query || null);
    }

    /**
     * @ngdoc method
     * @name sdContactsSearchPanel#search
     * @description function to perform search.
     */
    search() {
        this.setQueryString();
    }

    /*
    * Get search input from field while typed and query the text input.
    */
    searchField(field, text) {
        if (text) {
            this.contacts.queryField(field, text).then((items) => {
                this.scope.filteredList[field] = _.map(items._items, field);
                this.scope.meta[field] = text;
                this.renderSearchField(field);
            });
        }
    }

    keyPressed(event) {
        const ENTER = 13;

        if (event.keyCode === ENTER) {
            this.search();
            event.preventDefault();
        }
    }

    /**
     * @ngdoc method
     * @name sdContactsSearchPanel#clear
     * @description clear all search and refresh the results.
     */
    clear() {
        const fields = [..._.keys(URL_PARAMETERS), 'q'];

        this.$location.search(_.omit(this.$location.search(), fields));
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
export function ContactsSearchPanelDirective(contacts, $location) {
    return {
        template: require('scripts/apps/contacts/views/search-panel.html'),
        link: (scope, elem) => new LinkFunction(contacts, $location, scope, elem),
    };
}

ContactsSearchPanelDirective.$inject = ['contacts', '$location'];
