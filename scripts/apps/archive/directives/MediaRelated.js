MediaRelated.$inject = ['familyService', 'superdesk'];

export function MediaRelated(familyService, superdesk) {
    return {
        scope: {
            item: '='
        },
        templateUrl: 'scripts/apps/archive/views/related-view.html',
        link: function(scope, elem) {
            scope.$on('item:duplicate', fetchRelatedItems);

            scope.$watch('item', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    fetchRelatedItems();
                }
            });
            scope.open = function(item) {
                superdesk.intent('view', 'item', item).then(null, () => {
                    superdesk.intent('edit', 'item', item);
                });
            };

            function fetchRelatedItems() {
                familyService.fetchItems(scope.item.family_id || scope.item._id, scope.item)
                .then((items) => {
                    scope.relatedItems = items;
                });
            }

            fetchRelatedItems();
        }
    };
}
