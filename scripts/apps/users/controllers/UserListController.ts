import {gettext} from 'core/utils';

UserListController.$inject = ['$scope', '$location', 'api', 'lodash', 'session', 'usersService'];
export function UserListController($scope, $location, api, _, session, usersService) {
    var DEFAULT_SIZE = 25;

    $scope.selected = {user: null};
    $scope.createdUsers = [];
    $scope.online_users = false;
    $scope.authorOnlyFilter = false;

    api('roles')
        .query()
        .then((result) => {
            $scope.roles = _.keyBy(result._items, '_id');
            $scope.noRolesWarning = result._items.length === 0;
        });

    $scope.preview = function(user) {
        $scope.selected.user = user;
    };

    $scope.createUser = function() {
        $scope.intent('create', 'user').then(fetchUsers);
    };

    $scope.$on('intent:create:user', function createUser() {
    // fallback if there is no other activity
        $scope.preview({});
    });

    $scope.closePreview = function() {
        $scope.preview(null);
    };

    $scope.afterDelete = function(data) {
        if ($scope.selected.user && data.item && data.item.href === $scope.selected.user.href) {
            $scope.selected.user = null;
        }
        fetchUsers(getCriteria());
    };

    // make sure saved user is presented in the list
    $scope.render = function(user) {
        if (!findUser($scope.users._items, user) && !findUser($scope.createdUsers, user)) {
            $scope.createdUsers.unshift(user);
        }
    };

    function findUser(list, user) {
        if (angular.isUndefined(user)) {
            return false;
        }

        return _.find(list, (item) => item._links.self.href === user._links.self.href);
    }

    function getCriteria() {
        var params = $location.search(),
            criteria: any = {
                max_results: Number(params.max_results) || DEFAULT_SIZE,
            };

        criteria.where = initCriteria(params, $scope.userFilter);

        if (params.page) {
            criteria.page = parseInt(params.page, 10);
        }

        if (params.sort) {
            criteria.sort = formatSort(params.sort[0], params.sort[1]);
        } else {
            criteria.sort = formatSort('full_name', 'asc');
        }

        return criteria;
    }

    function initCriteria(search, filter) {
        const query: any = {};
        const canSeeSupportUsers = usersService.isSupport(session.identity);

        if (!canSeeSupportUsers) {
            query.is_support = {$ne: true};
        }

        if (search.q) {
            query.$or = [
                {username: {$regex: search.q, $options: '-i'}},
                {display_name: {$regex: search.q, $options: '-i'}},
                {email: {$regex: search.q, $options: '-i'}},
            ];
        }

        switch (filter) {
        case 'online':
            query.session_preferences = {$exists: true, $nin: [null, {}]};
            break;

        case 'pending':
            query.is_enabled = true;
            query.is_active = true;
            query.needs_activation = true;
            break;

        case 'inactive':
            query.is_enabled = true;
            query.is_active = false;
            break;

        case 'disabled':
            query.is_enabled = false;
            break;

        case 'all':
            break;

        default:
            query.is_active = true;
            query.is_enabled = true;
            query.needs_activation = false;
            break;
        }

        return JSON.stringify(query);
    }

    function fetchUsers(criteria) {
        api.users.query(criteria)
            .then((users) => {
                $scope.users = users;
                $scope.createdUsers = [];
            });
    }

    function formatSort(key, dir) {
        var val = dir === 'asc' ? 1 : -1;

        switch (key) {
        case 'full_name':
            return '[("first_name", ' + val + '), ("last_name", ' + val + ')]';
        default:
            return '[("' + encodeURIComponent(key) + '", ' + val + ')]';
        }
    }

    $scope.filterOptions = [
        {id: null, label: gettext('Active')},
        {id: 'online', label: gettext('Online')},
        {id: 'pending', label: gettext('Pending')},
        {id: 'inactive', label: gettext('Inactive')},
        {id: 'disabled', label: gettext('Disabled')},
        {id: 'all', label: gettext('All')},
    ];

    $scope.userFilter = null;

    $scope.$watchCollection(getCriteria, fetchUsers);
}
