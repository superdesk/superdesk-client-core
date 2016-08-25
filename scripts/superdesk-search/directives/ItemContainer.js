ItemContainer.$inject = ['$filter', 'desks', 'api'];
export function ItemContainer($filter, desks, api) {
    return {
        scope: {
            item: '='
        },
        template: '<span class="location-desk-label">{{item.label}}</span> {{item.value}}',
        link: function(scope, elem) {
            if (scope.item._type !== 'ingest') {
                if (scope.item.task && scope.item.task.desk) {
                    desks.initialize().then(function() {
                        if (desks.deskLookup[scope.item.task.desk]) {
                            scope.item.label = 'desk:';
                            scope.item.value = desks.deskLookup[scope.item.task.desk].name;
                        }
                    });
                } else {
                    if (scope.item._type === 'archive') {
                        scope.item.label = 'location:';
                        scope.item.value = 'workspace';
                    } else {
                        if (scope.item._type === 'archived') {
                            scope.item.label = '';
                            scope.item.value = 'archived';
                        }
                    }
                }
            }
        }
    };
}
