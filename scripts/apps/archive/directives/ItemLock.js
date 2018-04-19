ItemLock.$inject = ['api', 'lock', 'privileges', 'desks'];
export function ItemLock(api, lock, privileges, desks) {
    return {
        templateUrl: 'scripts/apps/archive/views/item-lock.html',
        scope: {item: '='},
        link: function(scope) {
            init();

            scope.$watch('item.lock_session', () => {
                init();

                if (scope.item && lock.isLocked(scope.item)) {
                    api('users').getById(scope.item.lock_user)
                        .then((user) => {
                            scope.lock.user = user;
                            scope.lock.lockbyme = lock.isLockedByMe(scope.item);
                        });
                }
            });

            function init() {
                scope.privileges = privileges.privileges;
                scope.lock = {user: null, lockbyme: false};
            }

            scope.unlock = function() {
                lock.previewUnlock = true;
                lock.unlock(scope.item).then(() => {
                    scope.item.lock_user = null;
                    scope.item.lock_session = null;
                    scope.lock = null;
                    scope.isLocked = false;
                });
            };

            scope.can_unlock = function() {
                if (lock.can_unlock(scope.item)) {
                    if (scope.item.task && scope.item.task.desk && desks.userDesks) {
                        return _.find(desks.userDesks, {_id: scope.item.task.desk});
                    }

                    return true;
                }

                return false;
            };

            scope.$on('item:lock', (_e, data) => {
                if (scope.item && scope.item._id === data.item) {
                    scope.item.lock_user = data.user;
                    scope.item.lock_time = data.lock_time;
                    scope.item.lock_session = data.lock_session;
                    scope.$digest();
                }
            });

            scope.$on('item:unlock', (_e, data) => {
                if (scope.item && scope.item._id === data.item) {
                    scope.item.lock_user = null;
                    scope.item.lock_session = null;
                    scope.$digest();
                }
            });
        },
    };
}
