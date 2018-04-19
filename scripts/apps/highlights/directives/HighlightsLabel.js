HighlightsLabel.$inject = ['desks', 'highlightsService'];
export function HighlightsLabel(desks, highlightsService) {
    return {
        scope: {highlight_id: '=highlight', totalItems: '=total'},
        template: '<span translate>{{ highlightItem.label }} ({{ totalItems }} items)</span>',
        link: function(scope) {
            highlightsService.get(desks.getCurrentDeskId()).then((result) => {
                scope.highlightItem = _.find(result._items, {_id: scope.highlight_id});
            });
        },
    };
}
