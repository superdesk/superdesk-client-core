import _ from 'lodash';

UserSelectList.$inject = ['$filter', 'api'];
export function UserSelectList($filter, api) {
    return {
        scope: {
            exclude: '=?',
            onchoose: '&',
            onsearch: '&',
            displayUser: '@',
            tabindex: '=',
        },
        templateUrl: 'scripts/apps/desks/views/user-select.html',
        link: function(scope, elem, attrs) {
            var ARROW_UP = 38, ARROW_DOWN = 40, ENTER = 13;

            scope.selected = null;
            scope.search = null;
            scope.users = {};
            scope.exclude = [];
            scope.refresh = true;
            scope.message = null;

            var _refresh = function() {
                scope.users = {};
                return api('users').query({where: JSON.stringify({
                    $or: [
                        {username: {$regex: scope.search, $options: '-i'}},
                        {first_name: {$regex: scope.search, $options: '-i'}},
                        {last_name: {$regex: scope.search, $options: '-i'}},
                        {email: {$regex: scope.search, $options: '-i'}},
                    ],
                })})
                    .then((result) => {
                        scope.users = result;
                        scope.users._items = _.filter(scope.users._items,
                            (item) => _.findIndex(scope.exclude, {_id: item._id}) === -1);
                        scope.selected = null;
                        if (scope.onsearch) {
                            scope.onsearch({search: scope.search});
                        }
                    });
            };
            var refresh = _.debounce(_refresh, 1000);

            scope.$watch('search', () => {
                if (scope.search && scope.refresh) {
                    refresh();
                }
                scope.refresh = true;
            });

            function getSelectedIndex() {
                if (scope.selected) {
                    return _.findIndex(scope.users._items, scope.selected);
                }

                return -1;
            }

            function previous() {
                var selectedIndex = getSelectedIndex();

                if (selectedIndex > 0) {
                    scope.select(scope.users._items[_.max([0, selectedIndex - 1])]);
                }
            }

            function next() {
                var selectedIndex = getSelectedIndex();

                scope.select(scope.users._items[_.min([scope.users._items.length - 1, selectedIndex + 1])]);
            }

            elem.bind('keydown keypress', (event) => {
                scope.$apply(() => {
                    switch (event.which) {
                    case ARROW_UP:
                        event.preventDefault();
                        previous();
                        break;
                    case ARROW_DOWN:
                        event.preventDefault();
                        next();
                        break;
                    case ENTER:
                        event.preventDefault();
                        if (getSelectedIndex() >= 0) {
                            scope.choose(scope.selected);
                        }
                        break;
                    }
                });
            });

            scope.choose = function(user) {
                scope.onchoose({user: user});
                if (scope.displayUser) {
                    scope.refresh = false;
                    scope.users = {};
                    scope.search = user[scope.displayUser];
                } else {
                    scope.search = null;
                }
            };

            scope.select = function(user) {
                scope.selected = user;
            };

            scope.getUserDisplay = function(user) {
                if (scope.displayUser) {
                    return user[scope.displayUser];
                }

                return user.display_name;
            };
        },
    };
}
