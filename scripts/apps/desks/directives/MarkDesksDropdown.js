import {DesksReactDropdown} from './DesksReactDropdown';
import ReactDOM from 'react-dom';

/**
 * @ngdoc directive
 * @module superdesk.apps.desks
 * @name MarkDesksDropdown
 *
 * @requires desks
 * @requires $timeout
 *
 *
 * @description Creates dropdown react element with list of available desks
 */
MarkDesksDropdown.$inject = ['desks', '$timeout', 'gettextCatalog', '$injector'];
export function MarkDesksDropdown(desks, $timeout, gettextCatalog, $injector) {
    return {
        link: function(scope, elem) {
            desks.fetchDesks().then(() => {
                var deskList = $injector.invoke(DesksReactDropdown, null, {
                    item: scope.item,
                    className: '',
                    noHighlightsLabel: gettextCatalog.getString('No available highlights'),
                    noDesksLabel: gettextCatalog.getString('No available desks'),
                    noLanguagesLabel: gettextCatalog.getString('No available translations'),
                });

                ReactDOM.render(deskList, elem[0]);
            });
        },
    };
}