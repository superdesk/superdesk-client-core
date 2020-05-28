import {BaseSortBar} from 'apps/search/directives/BaseSortBar';

class LinkFunction extends BaseSortBar {
    contacts: any;

    constructor(contacts, sort, scope, elem) {
        super(scope, elem, sort);
        this.contacts = contacts;
        this.scope.canSort = super.canSort.bind(this);
        this.scope.sortOptions = contacts.sortOptions;
        sort.setSort(this.scope.sortOptions[0].field, contacts.sortOptions);
        super.getActive();
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.contacts
 * @name sdContactsSortBar
 * @requires contacts
 * @requires sort
 * @description sd-contacts-sort-bar handle sort functionality.
 */
export function ContactsSortBarDirective(contacts, sort) {
    return {
        scope: {total: '='},
        template: require('apps/search/views/item-sortbar.html'),
        link: (scope, elem) => new LinkFunction(contacts, sort, scope, elem),
    };
}

ContactsSortBarDirective.$inject = ['contacts', 'sort'];
