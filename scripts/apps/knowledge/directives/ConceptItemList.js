/* eslint-disable react/no-render-return-value */
// TODO(*): Fix above?

import React from 'react';
import ReactDOM from 'react-dom';

import {ConceptItemList as ConceptItemListComponent} from 'apps/knowledge/components';

ConceptItemList.$inject = [
    '$location',
    '$timeout',
    '$injector',
    'datetime',
    'superdesk',
    'gettextCatalog',
    'config',
    'api'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.knowledge.ConceptItemList
 * @name sdConceptItemList
 *
 * @requires $location
 * @requires $timeout
 * @requires $injector
 * @requires datetime
 * @requires superdesk
 * @requires gettextCatalog
 * @requires config
 * @requires api
 *
 * @description Handles the functionality displaying list of concept items
 */

export function ConceptItemList(
    $location,
    $timeout,
    $injector,
    datetime,
    superdesk,
    gettextCatalog,
    config,
    api
) {
    // contains all the injected services to be passed down to child
    // components via props
    const services = {
        $location: $location,
        $timeout: $timeout,
        $injector: $injector,
        datetime: datetime,
        superdesk: superdesk,
        gettextCatalog: gettextCatalog,
        config: config
    };

    return {
        link: function(scope, elem) {
            var items = [],
                itemList = React.createElement(ConceptItemListComponent,
                    angular.extend({
                        svc: services,
                        scope: scope
                    }, '')),
                listComponent = ReactDOM.render(itemList, elem[0]);

            function init() {
                return api.query('concept_items', {max_results: 100}).then((result) => {
                    items = result._items;
                    return items;
                });
            }

            init().then((result) => {
                listComponent.setState({itemsList: items});
            });
        }
    };
}
