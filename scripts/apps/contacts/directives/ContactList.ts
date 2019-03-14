/* eslint-disable react/no-render-return-value */

import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import {ItemList as ItemListComponent} from 'apps/contacts/components';

ContactList.$inject = [
    '$timeout',
    '$filter',
    'search',
    'datetime',
    'Keys',
    '$rootScope',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.ContactList
 * @name sdContactsList
 *
 * @requires $timeout
 * @requires $filter
 * @requires search
 * @requires datetime
 * @requires Keys
 * @requires $rootScope
 *
 * @description Handles the functionality displaying list of items from contacts collection
 */

export function ContactList(
    $timeout,
    $filter,
    search,
    datetime,
    Keys,
    $rootScope,
) {
    // contains all the injected services to be passed down to child
    // components via props
    const services = {
        $timeout: $timeout,
        $filter: $filter,
        datetime: datetime,
        Keys: Keys,
        $rootScope: $rootScope,
    };

    return {
        link: function(scope, elem) {
            elem.attr('tabindex', 0);

            var itemList = React.createElement(ItemListComponent,
                angular.extend({
                    svc: services,
                    scope: scope,
                }));

            var listComponent = ReactDOM.render(itemList, elem[0]);

            scope.$watch('items', (items) => {
                if (!items || !items._items) {
                    return;
                }

                var itemsList = [];
                var currentItems = {};
                var itemsById = angular.extend({}, listComponent.state.itemsById);

                items._items.forEach((item) => {
                    var oldItem = itemsById[item._id] || null;

                    if (!oldItem || !_.isEqual(oldItem, item)) {
                        itemsById[item._id] = angular.extend({}, oldItem, item);
                    }

                    if (!currentItems[item._id]) { // filter out possible duplicates
                        currentItems[item._id] = true;
                        itemsList.push(item._id);
                    }
                });

                listComponent.setState({
                    itemsList: itemsList,
                    itemsById: itemsById,
                    view: scope.view,
                }, () => {
                    scope.rendering = scope.loading = false;
                });
            }, true);

            scope.$watch('view', (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    listComponent.setState({view: newValue});
                }
            });

            scope.singleLine = search.singleLine;

            var updateTimeout;

            /**
             * Function for creating small delay,
             * before activating render function
             */
            function handleScroll($event) {
                // force refresh the list, if scroll bar hits the top of list.
                if (elem[0].scrollTop === 0) {
                    $rootScope.$broadcast('refresh:list');
                }

                if (scope.rendering) { // ignore
                    $event.preventDefault();
                    return;
                }

                // only scroll the list, not its parent
                $event.stopPropagation();

                $timeout.cancel(updateTimeout);

                updateTimeout = $timeout(renderIfNeeded, 100, false);
            }

            /**
             * Trigger render in case user scrolls to the very end of list
             */
            function renderIfNeeded() {
                if (!scope.items) {
                    return; // automatic scroll after removing items
                }

                if (isListEnd(elem[0]) && !scope.rendering) {
                    scope.rendering = scope.loading = true;
                    scope.fetchNext(listComponent.state.itemsList.length);
                }
            }

            /**
             * Check if we reached end of the list elem
             *
             * @param {Element} elem
             * @return {Boolean}
             */
            function isListEnd(element) {
                return element.scrollTop + element.offsetHeight + 200 >= element.scrollHeight;
            }

            elem.on('keydown', listComponent.handleKey);

            elem.on('scroll', handleScroll);

            // remove react elem on destroy
            scope.$on('$destroy', () => {
                elem.off();
                ReactDOM.unmountComponentAtNode(elem[0]);
            });
        },
    };
}
