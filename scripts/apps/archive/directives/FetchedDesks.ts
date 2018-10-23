FetchedDesks.$inject = ['desks', 'familyService', '$location', 'superdesk'];

export function FetchedDesks(desks, familyService, $location, superdesk) {
    return {
        scope: {
            item: '=',
        },
        templateUrl: 'scripts/apps/archive/views/fetched-desks.html',
        link: function(scope, elem) {
            scope.$watchGroup(['item', 'item.archived'], () => {
                if (scope.item) {
                    familyService.fetchDesks(scope.item, false)
                        .then((fetchedDesks) => {
                            scope.desks = fetchedDesks;
                        });
                }
            });

            scope.selectFetched = function(desk) {
                if (desk.isUserDeskMember) {
                    desks.setCurrentDeskId(desk.desk._id);
                    $location.url('/workspace/monitoring');
                    if (desk.count === 1) {
                        superdesk.intent('edit', 'item', desk.item);
                    }
                }
            };
        },
    };
}
