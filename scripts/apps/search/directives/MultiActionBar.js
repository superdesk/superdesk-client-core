MultiActionBar.$inject = ['asset', 'multi', 'authoringWorkspace', 'superdesk'];
export function MultiActionBar(asset, multi, authoringWorkspace, superdesk) {
    return {
        controller: 'MultiActionBar',
        controllerAs: 'action',
        templateUrl: asset.templateUrl('apps/search/views/multi-action-bar.html'),
        scope: true,
        link: function(scope) {
            scope.multi = multi;
            scope.$watch(multi.getItems, detectType);
            scope.$on('item:lock', (_e, data) => {
                if (_.includes(multi.getIds(), data.item)) {
                    // locked item is in the selections so update lock info
                    var selectedItems = multi.getItems();

                    _.find(selectedItems, (_item) => _item._id === data.item).lock_user = data.user;
                    detectType(selectedItems);
                }
            });

            scope.isOpenItemType = function(type) {
                var openItem = authoringWorkspace.getItem();

                return openItem && openItem.type === type;
            };

            /**
             * Detects type of all selected items and assign it to scope,
             * but only when it's same for all of them.
             *
             * @param {Array} items
             */
            function detectType(items) {
                var types = {};
                var states = [];
                var activities = {};

                angular.forEach(items, (item) => {
                    types[item._type] = 1;
                    states.push(item.state);

                    var _activities = superdesk.findActivities({action: 'list', type: item._type}, item) || [];

                    _activities.forEach((activity) => {
                        if (!item.lock_user) { // ignore activities if the item is locked
                            activities[activity._id] = activities[activity._id] ? activities[activity._id] + 1 : 1;
                        }
                    });
                });

                // keep only activities available for all items
                Object.keys(activities).forEach((activity) => {
                    if (activities[activity] < items.length) {
                        activities[activity] = 0;
                    }
                });

                var typesList = Object.keys(types);

                scope.type = typesList.length === 1 ? typesList[0] : null;
                scope.state = typesList.length === 1 ? states[0] : null;
                scope.activity = activities;
            }
        }
    };
}
