/**
 * @ngdoc directive
 * @module superdesk.apps.desks
 * @name sdDeskSelect
 * @requires preferencesService
 * @description Directive to handle desk selection functionality in drop-downs/menus
 */
DeskSelect.$inject = ['Keys', 'lodash', 'preferencesService'];
export function DeskSelect(Keys, _, preferencesService) {
    const UP = -1;
    const DOWN = 1;

    class DeskSelectController {
        active: any;

        constructor() {
            this.active = null;
        }

        setActive(desk) {
            this.active = desk || null;
        }
    }

    return {
        templateUrl: 'scripts/apps/desks/views/desk-select.html',
        scope: {
            allDesks: '=desks',
            selectedDesk: '=',
            defaultDesk: '=',
            onChange: '&',
        },
        controller: DeskSelectController,
        controllerAs: 'ctrl',
        link: function(scope, elem, attrs) {
            elem[0].tabIndex = 0; // make elem recieve keyboard events

            scope.filter = '';

            preferencesService.get('desks:preferred').then((result) => {
                scope.preferredDesks = result;
            });

            /**
             * @ngdoc property
             * @name sdDeskSelect#deskPreferenceOrdering
             * @type {function}
             * @private
             * @param {object} desk in the list of desks to be sorted
             * @returns {bool} false if desk is preferred and true if not (false < true for sorting)
             * @description Determines if a desk is a preferred desk.
             */
            scope.deskPreferenceOrdering = function(desk) {
                return scope.preferredDesks ? !scope.preferredDesks.selected[desk._id] : true;
            };

            /**
             * Reset state
             */
            function reset() {
                scope.filter = '';
                scope.ctrl.setActive();
                filterDesks();
            }

            scope.$watch('isOpen', reset);

            let filterActive = (desk) => desk._id === scope.ctrl.active._id;

            /**
             * Move active item up or down
             *
             * @param {Number} diff
             */
            function moveActive(diff) {
                if (!scope.desks || !scope.desks.length) {
                    return;
                }

                var index = scope.ctrl.active ? _.findIndex(scope.desks, filterActive) : -diff;
                var next = Math.min(Math.max(0, index + diff), scope.desks.length - 1);

                scope.$apply(() => {
                    scope.ctrl.setActive(scope.desks[next]);
                });
            }

            /**
             * Filter desks by `scope.filter`
             */
            function filterDesks() {
                if (scope.allDesks) {
                    var filterRegexp = new RegExp('^' + scope.filter, 'i');

                    scope.desks = scope.allDesks.filter((desk) => !scope.filter || filterRegexp.test(desk.name));

                    // in case active item is filtered out keep focus
                    if (scope.ctrl.active && !scope.desks.find(filterActive)) {
                        elem.focus();
                    }
                }
            }

            /**
             * Remove last character and run filter on backspace
             */
            function backspaceAction() {
                scope.$apply(() => {
                    scope.filter = scope.filter.slice(0, -1);
                    filterDesks();
                });
            }

            scope.$on('key:down', (e) => {
                if (scope.isOpen) {
                    moveActive(DOWN);
                }
            });

            scope.$on('key:up', (e) => {
                if (scope.isOpen) {
                    moveActive(UP);
                }
            });

            scope.$on('key:backspace', (e) => {
                if (scope.isOpen) {
                    backspaceAction();
                }
            });

            // regexp for characters including unicode
            let charRegexp = /^[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]$/;

            const handleEnter = (e) => {
                e.stopPropagation();

                if (!scope.isOpen) {
                    return;
                }

                // on enter select active or first
                if (scope.ctrl.active || scope.desks.length) {
                    scope.$apply(() => {
                        var desk = scope.ctrl.active || scope.desks[0];

                        scope.onChange({desk: desk});
                    });
                } else {
                    return false;
                }
            };

            elem.on('keydown', (e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) { // ignore when ctrl/alt/meta is used
                    return;
                }

                switch (e.which) {
                case Keys.enter:
                    handleEnter(e);
                    break;

                case Keys.backspace:
                    e.stopPropagation();
                    backspaceAction();
                    break;

                case Keys.up:
                    e.preventDefault();
                    e.stopPropagation();
                    moveActive(UP);
                    break;

                case Keys.down:
                    e.preventDefault();
                    e.stopPropagation();
                    moveActive(DOWN);
                    break;

                default:
                    if (charRegexp.test(e.key)) {
                        e.stopPropagation();
                        scope.filter += e.key;
                        scope.$apply(filterDesks);
                    }
                }
            });
        },
    };
}
