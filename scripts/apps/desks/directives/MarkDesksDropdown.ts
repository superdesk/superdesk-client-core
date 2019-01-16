import {DesksReactDropdown} from './DesksReactDropdown';
import ReactDOM from 'react-dom';
import {gettext} from 'core/ui/components/utils';

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
MarkDesksDropdown.$inject = ['desks', '$timeout', '$injector'];
export function MarkDesksDropdown(desks, $timeout, $injector) {
    return {
        link: function(scope, elem) {
            desks.fetchDesks().then(() => {
                var deskList = $injector.invoke(DesksReactDropdown, null, {
                    item: scope.item,
                    className: '',
                    noHighlightsLabel: gettext('No available highlights'),
                    noDesksLabel: gettext('No available desks'),
                    noLanguagesLabel: gettext('No available translations'),
                });

                ReactDOM.render(deskList, elem[0]);
            });
        },
    };
}
