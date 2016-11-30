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
MarkDesksDropdown.$inject = ['desks', '$timeout'];
export function MarkDesksDropdown(desks, $timeout) {
    return {
        templateUrl: 'scripts/apps/desks/views/mark_desks_dropdown_directive.html',
        link: function(scope) {
            scope.markItem = function(desk) {
                scope.item.multiSelect = false;
                desks.markItem(desk._id, scope.item);
            };

            scope.isMarked = function(desk) {
                return scope.item && scope.item.marked_desks && _.findIndex(scope.item.marked_desks, (md) => {
                    md.desk_id === desk._id;
                }) >= 0;
            };

            desks.fetchDesks().then((result) => {
                scope.desks = result._items;
                $timeout(() => {
                    var deskDropdown = angular.element('.more-activity-menu.open .dropdown-noarrow');
                    var buttons = deskDropdown.find('button:not([disabled])');

                    if (buttons.length > 0) {
                        buttons[0].focus();
                    }
                });
            });
        }
    };
}