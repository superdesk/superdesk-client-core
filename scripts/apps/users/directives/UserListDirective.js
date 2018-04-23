import _ from 'lodash';

UserListDirective.$inject = ['keyboardManager', 'usersService', 'asset', 'session'];
export function UserListDirective(keyboardManager, usersService, asset, session) {
    return {
        templateUrl: asset.templateUrl('apps/users/views/user-list-item.html'),
        scope: {
            roles: '=',
            users: '=',
            authorOnlyFilter: '=',
            selected: '=',
            done: '=',
        },
        link: function(scope, elem, attrs) {
            scope.active = function(user) {
                return usersService.isActive(user);
            };

            scope.pending = function(user) {
                return usersService.isPending(user);
            };

            scope.select = function(user) {
                scope.selected = user;
                bindKeys();
            };

            scope.$watch('selected', (selected) => {
                if (_.isNil(selected)) {
                    bindKeys();
                }
            });

            scope.isLoggedIn = function(user) {
                return usersService.isLoggedIn(user);
            };

            function bindKeys() {
                unbindKeys();
                keyboardManager.bind('down', moveDown);
                keyboardManager.bind('up', moveUp);
            }

            function unbindKeys() {
                keyboardManager.unbind('down');
                keyboardManager.unbind('up');
            }

            function moveDown() {
                var selectedIndex = getSelectedIndex();

                if (selectedIndex !== undefined && selectedIndex !== -1) {
                    scope.select(scope.users[_.min([scope.users.length - 1, selectedIndex + 1])]);
                }
            }

            function moveUp() {
                var selectedIndex = getSelectedIndex();

                if (selectedIndex !== undefined && selectedIndex !== -1) {
                    scope.select(scope.users[_.max([0, selectedIndex - 1])]);
                }
            }

            function getSelectedIndex() {
                if (!_.isEmpty(scope.selected)) {
                    return _.findIndex(scope.users, (user) => user._id === scope.selected._id);
                }
            }
        },
    };
}
