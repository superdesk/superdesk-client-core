import _ from 'lodash';

MultiMarkHighlightsDropdown.$inject = ['desks', 'highlightsService', 'multi'];
export function MultiMarkHighlightsDropdown(desks, highlightsService, multi) {
    return {
        templateUrl: 'scripts/apps/highlights/views/mark_highlights_dropdown_directive.html',
        link: function(scope) {
            scope.markItem = function(highlight) {
                angular.forEach(multi.getItems(), (item) => {
                    item.multiSelect = true;
                    if (!_.includes(item.highlights, highlight._id)) {
                        highlightsService.markItem(highlight._id, item);
                    }
                });
                multi.reset();
            };

            scope.isMarked = function(highlight) {
                var result = _.find(multi.getItems(),
                    (item) => !item.highlights || item.highlights.indexOf(highlight._id) === -1);

                return !result;
            };

            // If the user has no desks assigned - this user should not view ANY highlights (including global)
            if (desks.userDesks.length > 0) {
                highlightsService.get(desks.getCurrentDeskId()).then((result) => {
                    scope.highlights = [];
                    result._items.forEach((item) => {
                        // Multi mark highlights should only show global highlights
                        if (!item.desks.length) {
                            scope.highlights.push(item);
                        }
                    });
                });
            }
        },
    };
}
