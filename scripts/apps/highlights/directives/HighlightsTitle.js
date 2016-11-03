HighlightsTitle.$inject = ['highlightsService', '$timeout', 'authoring'];
export function HighlightsTitle(highlightsService, $timeout, authoring) {
    return {
        scope: {
            item: '=item'
        },
        templateUrl: 'scripts/apps/highlights/views/highlights_title_directive.html',
        // todo(petr): refactor to use popover-template once angular-bootstrap 0.13 is out
        link: function(scope, elem) {

            /*
             * Toggle 'open' class on dropdown menu element
             * @param {string} isOpen
             */
            scope.toggleClass = function (isOpen) {
                scope.open = isOpen;
            };

            scope.hasMarkItemPrivilege = authoring.itemActions(scope.item).mark_item;

            scope.$on('item:highlight', function($event, data) {
                var highlights = scope.item.highlights || [];
                if (scope.item._id === data.item_id) {
                    scope.$apply(function() {
                        if (data.marked) {
                            scope.item.highlights = highlights.concat(data.highlight_id);
                        } else {
                            scope.item.highlights = _.without(highlights, data.highlight_id);
                        }
                    });
                }
            });

            scope.$watch('item.highlights', function(items) {
                if (items) {
                    highlightsService.get().then(function(result) {
                        scope.highlights = _.filter(result._items, function(highlight) {
                            return items.indexOf(highlight._id) >= 0;
                        });
                    });
                }
            });

            var closeTimeout, self;

            elem.on({
                click: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                },
                mouseenter: function (e) {
                    self = $(this).find('.highlights-list');
                    self.not('.open').children('.dropdown__toggle').click();

                    angular.element('.highlights-list-menu.open').on({
                        mouseenter: function () {
                            $timeout.cancel(closeTimeout);
                        },
                        mouseleave: function () {
                            self.filter('.open').children('.dropdown__toggle').click();
                        }
                    });

                },
                mouseleave: function () {
                    closeTimeout = $timeout(function () {
                        self.filter('.open').children('.dropdown__toggle').click();
                    }, 100, false);
                }
            });

            /*
             * Removing highlight from an item
             * @param {string} highlight
             */
            scope.unmarkHighlight = function (highlight) {
                highlightsService.markItem(highlight, scope.item).then(function() {
                    scope.item.highlights = _.without(scope.item.highlights, highlight);
                });
            };
        }
    };
}
