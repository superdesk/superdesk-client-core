PackageHighlightsDropdown.$inject = ['desks', 'highlightsService', '$location', '$route'];
export function PackageHighlightsDropdown(desks, highlightsService, $location, $route) {
    return {
        scope: true,
        templateUrl: 'scripts/apps/highlights/views/package_highlights_dropdown_directive.html',
        link: function(scope) {
            scope.$watch(function() {
                return desks.active;
            }, function(active) {
                scope.selected = active;
                highlightsService.get(desks.getCurrentDeskId()).then(function(result) {
                    scope.highlights = result._items;
                    scope.hasHighlights = _.size(scope.highlights) > 0;
                });
            });

            scope.listHighlight = function(highlight) {
                $location.url('workspace/highlights?highlight=' + highlight._id);
                $route.reload();
            };
        }
    };
}
