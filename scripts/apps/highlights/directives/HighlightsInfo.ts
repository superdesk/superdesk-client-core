HighlightsInfo.$inject = [];
export function HighlightsInfo() {
    return {
        scope: {
            item: '=item',
        },
        templateUrl: 'scripts/apps/highlights/views/highlights_info_directive.html',
    };
}
