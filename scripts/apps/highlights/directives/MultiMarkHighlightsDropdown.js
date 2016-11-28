MultiMarkHighlightsDropdown.$inject = ['desks', 'highlightsService', 'multi'];
export function MultiMarkHighlightsDropdown(desks, highlightsService, multi) {
    return {
        templateUrl: 'scripts/apps/highlights/views/mark_highlights_dropdown_directive.html',
        link: function(scope) {
            scope.markItem = function(highlight) {
                angular.forEach(multi.getItems(), function(item) {
                    item.multiSelect = true;
                    if (!_.includes(item.highlights, highlight._id)) {
                        highlightsService.markItem(highlight._id, item);
                    }
                });
                multi.reset();
            };

            scope.isMarked = function(highlight) {
                var result = _.find(multi.getItems(), function(item) {
                    return !item.highlights || item.highlights.indexOf(highlight._id) === -1;
                });
                return !result;
            };

            highlightsService.get(desks.getCurrentDeskId()).then(function(result) {
                scope.highlights = [];
                result._items.forEach(function(item) {
                    if (!item.desks.length) {
                        scope.highlights.push(item);
                    }
                });
            });
        }
    };
}
