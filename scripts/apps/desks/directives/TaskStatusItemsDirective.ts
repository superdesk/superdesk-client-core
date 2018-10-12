TaskStatusItemsDirective.$inject = ['search', 'api', 'desks'];
export function TaskStatusItemsDirective(search, api, desks) {
    return {
        templateUrl: 'scripts/apps/desks/views/task-status-items.html',
        scope: {
            status: '=',
            desk: '=',
            total: '=',
        },
        link: function(scope, elem) {
            scope.users = desks.userLookup;

            var query = search.query({});

            query.filter({and: [
                {term: {'task.status': scope.status}},
                {term: {'task.desk': scope.desk}},
            ]});
            query.size(10);
            var criteria = {source: query.getCriteria()};

            scope.loading = true;

            api('archive').query(criteria)
                .then((items) => {
                    scope.loading = false;
                    scope.items = items._items;
                    scope.total = items._meta.total;
                }, () => {
                    scope.loading = false;
                });
        },
    };
}
