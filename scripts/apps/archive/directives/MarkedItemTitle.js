/**
 * @module superdesk.apps.archive
 * @ngdoc directive
 * @name sdMarkedItemTitle
 * @requires desks
 * @requires authoring
 * @requires highlightServce
 * @requires $timeout
 * @description
 *   This directive is used in authoring-topbar to mark a story as a highlight or
 *   to mark it for a desk.
 */
MarkedItemTitle.$inject = ['desks', '$timeout', 'authoring', 'highlightsService'];
export function MarkedItemTitle(desks, $timeout, authoring, highlightsService) {
    return {
        scope: {
            item: '=item',
            markField: '@field'
        },
        templateUrl: 'scripts/apps/archive/views/marked_item_title.html',
        // todo(petr): refactor to use popover-template once angular-bootstrap 0.13 is out
        link: function(scope, elem) {
            /*
             * Toggle 'open' class on dropdown menu element
             * @param {string} isOpen
             */
            scope.toggleClass = function(isOpen) {
                scope.open = isOpen;
            };

            scope.marks = scope.item[scope.markField];
            scope.hasMarkItemPrivilege = authoring.itemActions(scope.item).mark_item_for_desks;

            scope.$on('item:' + scope.markField, ($event, data) => {
                let marks = scope.marks || [];

                if (scope.item._id === data.item_id) {
                    scope.$apply(() => {
                        if (data.marked) {
                            scope.marks = marks.concat(data.mark_id);
                        } else {
                            scope.marks = _.without(marks, data.mark_id);
                        }
                    });
                }
            });

            // Check if the directive is created to mark desks or highlights
            if (scope.markField === 'marked_desks') {
                scope.className = 'icon-bell';
                scope.service = desks;
                scope.fetchFunction = desks.fetchDesks;
            } else {
                scope.service = highlightsService;
                scope.fetchFunction = highlightsService.get;
                scope.className = 'icon-star red';
                if (scope.marks && scope.marks.length > 1) {
                    scope.className = 'icon-multi-star red';
                }
            }

            scope.$watch('item.' + scope.markField, (marks) => {
                if (marks) {
                    scope.fetchFunction().then((result) => {
                        scope.markObjects = result._items.filter((obj) => (scope.marks || []).includes(obj._id));
                    });
                }
            });

            var closeTimeout, popup;

            elem.on({
                click: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                },
                mouseenter: function(e) {
                    popup = $(this).find('.highlights-list');
                    popup.not('.open').children('.dropdown-toggle')
                    .click();

                    angular.element('.highlights-list-menu.open').on({
                        mouseenter: function() {
                            $timeout.cancel(closeTimeout);
                        },
                        mouseleave: function() {
                            popup.filter('.open').children('.dropdown-toggle')
                            .click();
                        }
                    });
                }
            });

            /*
             * Removing marking from an item
             * @param {string} mark
             */
            scope.unmark = function(mark) {
                scope.service.markItem(mark, scope.item).then(() => {
                    scope.item[scope.markField] = _.without(scope.marks, mark);
                });
            };
        }
    };
}