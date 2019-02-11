import {gettext} from 'core/utils';

ResendItem.$inject = ['subscribersService', 'authoring', 'api', 'notify'];

export function ResendItem(subscribersService, authoring, api, notify) {
    return {
        templateUrl: 'scripts/apps/archive/views/resend-configuration.html',
        scope: {item: '='},
        link: function(scope, elem, attr) {
            scope.$watch('item', (item) => {
                scope.selectedSubscribers = {items: []};

                if (item && !scope.customSubscribers) {
                    subscribersService.fetchTargetableSubscribers().then((items) => {
                        scope.customSubscribers = [];
                        scope.subscribers = items._items;
                        _.each(items, (item) => {
                            scope.customSubscribers.push({qcode: item._id, name: item.name});
                        });
                    });
                }
            });

            function getSubscriberIds() {
                var subscriberIds = [];

                _.forEach(scope.selectedSubscribers.items, (item) => {
                    subscriberIds.push(item.qcode);
                });
                return subscriberIds;
            }

            scope.resendItem = function() {
                var data = {subscribers: getSubscriberIds(), version: scope.item._current_version};

                api.save('archive_resend', {}, data, scope.item)
                    .then(() => {
                        notify.success(gettext('Item has been resent.'));
                        scope.cancel();
                    }, (response) => {
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
        },
    };
}
