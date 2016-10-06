ResendItem.$inject = ['subscribersService', 'authoring', 'api', 'notify', 'gettext'];

export function ResendItem(subscribersService, authoring, api, notify, gettext) {
    return {
        templateUrl: 'scripts/apps/archive/views/resend-configuration.html',
        scope: {item: '='},
        link: function (scope, elem, attr) {
            scope.$watch('item', function(item) {
                scope.selectedSubscribers = {items: []};

                if (item && !scope.customSubscribers) {
                    subscribersService.fetchTargetableSubscribers().then(function(items) {
                        scope.customSubscribers = [];
                        scope.subscribers = items._items;
                        _.each(items, function(item) {
                            scope.customSubscribers.push({'qcode': item._id, 'name': item.name});
                        });
                    });
                }
            });

            function getSubscriberIds() {
                var subscriberIds = [];
                _.forEach(scope.selectedSubscribers.items, function(item) {
                    subscriberIds.push(item.qcode);
                });
                return subscriberIds;
            }

            scope.resendItem = function () {
                var data = {subscribers: getSubscriberIds(), version: scope.item._current_version};
                api.save('archive_resend', {}, data, scope.item)
                    .then(function () {
                        notify.success(gettext('Item has been resent.'));
                        scope.cancel();
                    }, function (response) {
                        if (response.data._message) {
                            notify.error(response.data._message);
                        } else {
                            notify.error(gettext('Unknown Error: Cannot resend the item'));
                        }
                    });
            };

            scope.cancel = function() {
                scope.item = null;
            };
        }
    };
}
