MediaRelated.$inject = ['superdesk'];

export function MediaRelated(superdesk) {
    return {
        scope: {
            item: '=',
            relatedItems: '=',
        },
        templateUrl: 'scripts/apps/archive/views/related-view.html',
        link: function(scope, elem) {
            scope.open = function(item) {
                superdesk.intent('view', 'item', item).then(null, () => {
                    superdesk.intent('edit', 'item', item);
                });
            };
        },
    };
}
