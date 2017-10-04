DeskListController.$inject = ['$scope', 'desks', 'superdesk', 'privileges', 'tasks', 'api', 'betaService'];
export function DeskListController($scope, desks, superdesk, privileges, tasks, api, beta) {
    var userDesks;

    function sorted(result) {
        var items = result._items || [];

        items.sort(compareNames);
        return items;

        function compareNames(a, b) {
            return a.name.localeCompare(b.name);
        }
    }

    desks.initialize()
        .then(() => {
            $scope.desks = desks.desks;
            $scope.deskStages = desks.deskStages;

            desks.fetchCurrentUserDesks().then((deskList) => {
                userDesks = deskList;
            });
        });

    $scope.statuses = tasks.statuses;
    $scope.online_users = false;

    api('roles').query()
        .then((result) => {
            $scope.roles = sorted(result);
        });

    $scope.privileges = privileges.privileges;

    beta.isBeta().then((isBeta) => {
        var views = ['content', 'users', 'sluglines'];

        if (isBeta) {
            views = ['content', 'tasks', 'users', 'sluglines'];
        }

        $scope.$applyAsync(() => {
            $scope.views = views;
            $scope.view = $scope.views[0];
        });
    });

    $scope.setView = function(view) {
        $scope.view = view;
    };

    $scope.changeOnlineUsers = function(value) {
        $scope.online_users = value;
    };

    $scope.isMemberOf = function(desk) {
        return _.find(userDesks, {_id: desk._id}) !== null;
    };

    $scope.openDeskView = function(desk, target) {
        desks.setCurrentDeskId(desk._id);
        superdesk.intent('view', target);
    };
}
