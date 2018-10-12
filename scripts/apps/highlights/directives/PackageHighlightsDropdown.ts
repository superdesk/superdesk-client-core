PackageHighlightsDropdown.$inject = ['desks', 'highlightsService', '$location', '$route', 'lodash'];
export function PackageHighlightsDropdown(desks, highlightsService, $location, $route, _) {
    return {
        scope: true,
        templateUrl: 'scripts/apps/highlights/views/package_highlights_dropdown_directive.html',
        link: function(scope) {
            scope.$watch(() => desks.active, (active) => {
                scope.selected = active;

                // If the user has no desks assigned - this user should not view ANY highlights (including global)
                if (!_.isEmpty(desks.userDesks)) {
                    highlightsService.get(desks.getCurrentDeskId()).then((result) => {
                        scope.highlights = _.sortBy(result._items, (i) => i.name.toLowerCase());
                        scope.hasHighlights = _.size(scope.highlights) > 0;
                    });
                }
            });

            scope.listHighlight = function(highlight) {
                $location.url('workspace/highlights?highlight=' + highlight._id);
                $route.reload();
            };
        },
    };
}
