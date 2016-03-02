(function() {
    'use strict';

    angular.module('superdesk.widgets.relatedItem', [
        'superdesk.widgets.base',
        'superdesk.authoring.widgets'
    ])
    .config(['authoringWidgetsProvider', function(authoringWidgets) {
            authoringWidgets.widget('related-item', {
                label: gettext('Related Item'),
                icon: 'related',
                template: 'scripts/superdesk-archive/related-item-widget/widget-relatedItem.html',
                order: 7,
                side: 'right',
                display: {authoring: true, packages: false, killedItem: true, legalArchive: false, archived: false}
            });
        }])
        .controller('relatedItemController',
        ['$scope', 'api', 'BaseWidgetController', '$location', 'notify', 'superdesk', '$q', 'authoringWorkspace', 'authoring', 'privileges',
        function ($scope, api, BaseWidgetController, $location, notify, superdesk, $q, authoringWorkspace, authoring, privileges) {
            $scope.type = 'archiveWidget';
            $scope.itemListOptions = {
                endpoint: 'search',
                repo: ['archive', 'published'],
                notStates: ['spiked'],
                types: ['text', 'picture', 'audio', 'video', 'composite', 'preformatted'],
                page: 1,
                modificationDateAfter: 'now-1d'
            };
            $scope.options = {
                pinEnabled: true,
                modeEnabled: true,
                searchEnabled: true,
                itemTypeEnabled: true,
                mode: 'basic',
                pinMode: 'archive',
                related: true,
                itemTypes: ['text', 'picture', 'audio', 'video', 'composite']
            };
            $scope.actions = {
                apply: {
                    title: 'Associate metadata',
                    method: function(item) {
                        /*TODOs:
                        1) Overwrite Destination code
                        2) Patch IPTC Code
                        3) Overwrite category, service and locator fields
                        */

                        $scope.origItem = $scope.options.item;
                        $scope.options.item.subject = item.subject;
                        $scope.options.item.anpa_category = item.anpa_category;
                        $scope.options.item.headline = item.headline;
                        $scope.options.item.urgency = item.urgency;
                        $scope.options.item.priority = item.priority;
                        $scope.options.item.slugline = item.slugline;
                        $scope.options.item.related_to = item._id;
                        api.save('archive', $scope.origItem, $scope.options.item).then(function(_item) {
                            notify.success(gettext('item metadata associated.'));
                            return item;
                        });
                    },
                    'class': 'open',
                    icon: 'icon-expand',
                    condition: function(item) {
                        return true;
                    }
                },
                update: {
                    title: 'Associate as update',
                    method: function(item) {

                        api.save('archive_rewrite', {},
                            {'update': angular.extend({}, $scope.origItem, $scope.item)},
                            item)
                        .then(function(new_item) {
                                    notify.success(gettext('Story is associated as update.'));
                                    authoringWorkspace.edit(new_item._id);
                                }, function(response) {
                                    if (angular.isDefined(response.data._message)) {
                                        notify.error(gettext('Failed to associate update: ' + response.data._message));
                                    } else {
                                        notify.error(gettext('There is an error. Failed to associate update.'));
                                    }
                                });
                    },
                    'class': 'open',
                    icon: 'icon-expand',
                    condition: function(item) {
                        var userHasPermission = privileges.userHasPrivileges({rewrite: 1});

                        var canBeRewrite = !authoring.isPublished() &&
                        _.contains(['text', 'preformatted'], $scope.item.type) &&
                        !$scope.item.rewrite_of &&
                        authoring.itemActions($scope.item).new_take &&
                        (!$scope.item.broadcast || !$scope.item.broadcast.master_id);

                        var canBeRewritten = authoring.itemActions(item).re_write;

                        return canBeRewritten && canBeRewrite && userHasPermission;
                    }
                },
                open: {
                    title: 'Open',
                    method: function(item) {
                        $q.when(superdesk.intent('edit', 'item', item)).then(null, function(value) {
                            superdesk.intent('view', 'item', item);
                        });
                    },
                    'class': 'open',
                    icon: 'icon-external',
                    condition: function(item) {
                        return true;
                    }
                }
            };
            BaseWidgetController.call(this, $scope);
        }]);
})();
