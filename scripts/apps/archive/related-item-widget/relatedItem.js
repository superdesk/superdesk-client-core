angular.module('superdesk.apps.dashboard.widgets.relatedItem', [
    'superdesk.apps.dashboard.widgets.base',
    'superdesk.apps.authoring.widgets'
])
    .controller('relatedItemController', RelatedItemController)
    .config(['authoringWidgetsProvider', function(authoringWidgets) {
        authoringWidgets.widget('related-item', {
            label: gettext('Related Item'),
            icon: 'related',
            template: 'scripts/apps/archive/related-item-widget/widget-relatedItem.html',
            order: 7,
            side: 'right',
            display: {authoring: true, packages: false, killedItem: true, legalArchive: false, archived: false},
            configurationTemplate: 'scripts/apps/archive/related-item-widget/relatedItem-configuration.html',
            configurable: true,
            configuration: {
                sluglineMatch: 'EXACT',
                modificationDateAfter: 'today'
            }
        });
    }]);

RelatedItemController.$inject = [
    '$scope',
    'api',
    'BaseWidgetController',
    'notify',
    'superdesk',
    '$q',
    'authoringWorkspace',
    'authoring',
    'privileges',
    'config',
    'storage'
];

function RelatedItemController(
    $scope,
    api,
    BaseWidgetController,
    notify,
    superdesk,
    $q,
    authoringWorkspace,
    authoring,
    privileges,
    config,
    storage
) {
    $scope.type = 'archiveWidget';
    $scope.itemListOptions = {
        endpoint: 'search',
        repo: ['archive', 'published'],
        notStates: ['spiked'],
        types: ['text', 'composite'],
        page: 1,
        modificationDateAfter: storage.getItem('modificationDateAfter') === 'today' ? today() :
            storage.getItem('modificationDateAfter') || today(),
        sluglineMatch: storage.getItem('sluglineMatch') || 'EXACT'
    };
    $scope.options = {
        pinEnabled: true,
        modeEnabled: true,
        searchEnabled: true,
        itemTypeEnabled: true,
        mode: 'basic',
        pinMode: 'archive',
        related: true,
        itemTypes: ['text', 'composite'],
        sort: [{versioncreated: 'desc'}]
    };

    function today() {
        if (config.search && config.search.useDefaultTimezone) {
            return moment()
                .tz(config.defaultTimezone)
                .format('YYYY-MM-DD') + 'T00:00:00' + moment.tz(config.defaultTimezone).format('ZZ');
        }
        return moment().format('YYYY-MM-DD') + 'T00:00:00' + moment().format('ZZ');
    }

    $scope.actions = {
        apply: {
            title: 'Associate metadata',
            method: function(item) {
                /* TODOs:
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
                api.save('archive', $scope.origItem, $scope.options.item).then((_item) => {
                    notify.success(gettext('item metadata associated.'));
                    return item;
                });
            },
            class: 'open',
            icon: 'icon-expand',
            condition: function(item) {
                return item.type !== 'composite';
            }
        },
        addTake: {
            title: 'Associate as take',
            method: function(item) {
                var target = {_id: item.package_type === 'takes' ? item.last_take : item._id};
                var originalItem = $scope.item;

                authoring.linkItem(target, $scope.item._id).then((_item) => {
                    notify.success(gettext('item is associated as a take.'));
                    authoringWorkspace.close(false);
                    authoringWorkspace.edit(originalItem);
                }, (err) => {
                    if (angular.isDefined(err.data._message)) {
                        notify.error(gettext('Failed to associated as take: ' + err.data._message));
                    } else {
                        notify.error(gettext('There is an error. Failed to associated as take.'));
                    }
                });
            },
            class: 'open',
            icon: 'icon-expand',
            condition: function(item) {
                var canHaveNewTake = authoring.itemActions(item).new_take;

                return (item.package_type === 'takes' || canHaveNewTake) &&
                        $scope.item.type === 'text' &&
                        !$scope.item.takes &&
                        $scope.item._current_version >= 1 &&
                        !$scope.item.rewrite_of && !$scope.item.rewritten_by;
            }
        },
        update: {
            title: 'Associate as update',
            method: function(item) {
                api.save('archive_rewrite', {},
                    {update: angular.extend({}, $scope.origItem, $scope.item)},
                    item)
                .then((newItem) => {
                    notify.success(gettext('Story is associated as update.'));
                    authoringWorkspace.edit(newItem._id);
                }, (response) => {
                    if (angular.isDefined(response.data._message)) {
                        notify.error(gettext('Failed to associate update: ' + response.data._message));
                    } else {
                        notify.error(gettext('There is an error. Failed to associate update.'));
                    }
                });
            },
            class: 'open',
            icon: 'icon-expand',
            condition: function(item) {
                var userHasPermission = privileges.userHasPrivileges({rewrite: 1});

                var canBeRewrite = !authoring.isPublished($scope.item) &&
                _.includes(['text', 'preformatted'], $scope.item.type) &&
                !$scope.item.rewrite_of && authoring.itemActions($scope.item).new_take &&
                (!$scope.item.broadcast || !$scope.item.broadcast.master_id) && !authoring.isTakeItem($scope.item);

                var canBeRewritten = authoring.itemActions(item).re_write;

                return canBeRewritten && canBeRewrite && userHasPermission;
            }
        },
        open: {
            title: 'Open',
            method: function(item) {
                $q.when(superdesk.intent('edit', 'item', item)).then(null, (value) => {
                    superdesk.intent('view', 'item', item);
                });
            },
            class: 'open',
            icon: 'icon-external',
            condition: function(item) {
                return true;
            }
        }
    };

    if (config.features && config.features.noTakes) {
        delete $scope.actions.addTake;
    }

    BaseWidgetController.call(this, $scope);

    $scope.$watch('widget.configuration', (config) => {
        if (config && config.sluglineMatch && config.sluglineMatch !== $scope.itemListOptions.sluglineMatch) {
            $scope.itemListOptions.sluglineMatch = config.sluglineMatch;
        }

        if (config && config.modificationDateAfter &&
            config.modificationDateAfter !== $scope.itemListOptions.modificationDateAfter) {
            if (config.modificationDateAfter === 'today') {
                $scope.itemListOptions.modificationDateAfter = today();
            } else {
                $scope.itemListOptions.modificationDateAfter = config.modificationDateAfter;
            }
        }
    }, true);

    function reset() {
        if ($scope.widget && $scope.widget.configuration) {
            $scope.widget.configuration.modificationDateAfter = storage.getItem('modificationDateAfter') || 'today';
            $scope.widget.configuration.sluglineMatch = storage.getItem('sluglineMatch') || 'EXACT';
        }
    }

    if ($scope.widget) {
        $scope.widget.save = function() {
            storage.setItem('sluglineMatch', $scope.widget.configuration.sluglineMatch);
            storage.setItem('modificationDateAfter', $scope.widget.configuration.modificationDateAfter);
        };
    }

    reset();
}
