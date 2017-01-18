/**
 * @ngdoc directive
 * @module superdesk.apps.highlights
 * @name HighlightsTitle
 *
 * @requires highlightsService
 * @requires $timeout
 * @requires authoring
 * @requires $location
 * @requires $filter
 * @requires lodash
 *
 * @description
 *   This directive is responsible for displaying highlights of an item and allowing remove option on item's highlights
 */

HighlightsTitle.$inject = ['highlightsService', '$timeout', 'authoring', '$location', '$filter', 'lodash'];
export function HighlightsTitle(highlightsService, $timeout, authoring, $location, $filter, _) {
    return {
        scope: {
            item: '=item'
        },
        templateUrl: 'scripts/apps/highlights/views/highlights_title_directive.html',
        // todo(petr): refactor to use popover-template once angular-bootstrap 0.13 is out
        link: function(scope, elem) {
            /**
             * @ngdoc method
             * @name HighlightsTitle#toggleClass
             * @param {Boolean} isOpen - toggle value to be applied
             * @description Toggles 'open' class on dropdown menu element
             * @returns {Boolean}
             */
            scope.toggleClass = function(isOpen) {
                scope.open = isOpen;
            };

            /**
             * @ngdoc method
             * @name HighlightsTitle#isActiveHighlights
             * @description Evaluates if any of item's highlights are active to apply 'red' class it's highlights icon
             * @returns {Boolean}
             */
            scope.isActiveHighlights = function() {
                var highlightStatuses = {};

                _.forEach(scope.highlights, (highlight) => {
                    var hours = $filter('hoursFromNow')(scope.item.versioncreated);

                    highlightStatuses[highlight._id] = highlightsService.isInDateRange(highlight, hours);
                });

                if ($location.path() === '/workspace/highlights') {
                    return highlightStatuses[$location.search().highlight._id];
                }

                return scope.highlights.some((h) => highlightStatuses[h._id]);
            };

            scope.hasMarkItemPrivilege = authoring.itemActions(scope.item).mark_item_for_highlight;

            scope.$on('item:highlights', ($event, data) => {
                var highlights = scope.item.highlights || [];

                if (scope.item._id === data.item_id) {
                    scope.$apply(() => {
                        if (data.marked) {
                            scope.item.highlights = highlights.concat(data.mark_id);
                        } else {
                            scope.item.highlights = _.without(highlights, data.mark_id);
                        }
                    });
                }
            });

            scope.$watch('item.highlights', (items) => {
                if (items) {
                    highlightsService.get().then((result) => {
                        scope.highlights = _.filter(result._items, (highlight) => items.indexOf(highlight._id) >= 0);
                    });
                }
            });

            elem.on({
                click: function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            /**
             * @ngdoc method
             * @name HighlightsTitle#unmarkHighlight
             * @param {String} highlight - _id of the highlight to be removed
             * @description Removing highlight from an item
             */
            scope.unmarkHighlight = function(highlight) {
                highlightsService.markItem(highlight, scope.item).then(() => {
                    scope.item.highlights = _.without(scope.item.highlights, highlight);
                });
            };
        }
    };
}
