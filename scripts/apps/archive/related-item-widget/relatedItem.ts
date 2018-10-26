angular.module('superdesk.apps.dashboard.widgets.relatedItem', [
    'superdesk.apps.dashboard.widgets.base',
    'superdesk.apps.authoring.widgets',
])
    .controller('relatedItemController', RelatedItemController)
    .config(['authoringWidgetsProvider', function(authoringWidgets) {
        authoringWidgets.widget('related-item', {
            label: gettext('Related Items'),
            icon: 'related',
            template: 'scripts/apps/archive/related-item-widget/widget-relatedItem.html',
            order: 7,
            side: 'right',
            display: {
                authoring: true,
                packages: false,
                killedItem: true,
                legalArchive: false,
                archived: false,
                picture: false,
                personal: false,
            },
            isWidgetVisible: (item) => ['content', function(content) {
                if (item.profile == null) {
                    return Promise.resolve(true);
                }

                return new Promise((resolve) => {
                    content.getType(item.profile).then((type) => {
                        resolve(type.schema.hasOwnProperty('slugline'));
                    });
                });
            }],
            configurationTemplate: 'scripts/apps/archive/related-item-widget/relatedItem-configuration.html',
            configurable: false,
            needEditable: true,
            needUnlock: true,
            configuration: {
                sluglineMatch: 'EXACT',
                modificationDateAfter: 'today',
            },
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
    'storage',
    'familyService',
    'gettext',
    'moment',
    'content',
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
    storage,
    familyService,
    gettext,
    moment,
    content,
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
        sluglineMatch: storage.getItem('sluglineMatch') || 'EXACT',
    };
    $scope.options = {
        pinEnabled: true,
        modeEnabled: true,
        itemTypeEnabled: true,
        mode: 'basic',
        pinMode: 'archive',
        related: true,
        itemTypes: ['text', 'composite'],
        sort: [{versioncreated: 'desc'}],
    };

    $scope.loading = true;
    familyService.fetchRelatedItems($scope.item)
        .then((items) => {
            if (items && items._items && items._items.length > 1) {
                $scope.options.existingRelations = items._items;
                $scope.widget.configurable = false;
                $scope.options.searchEnabled = false;
                $scope.widget.label = gettext('Related Items');
            } else {
                $scope.options.existingRelations = false;
                $scope.widget.configurable = true;
                $scope.options.searchEnabled = true;
                $scope.widget.label = gettext('Relate an item');
            }
        })
        .finally(() => {
            $scope.loading = false;
        });

    function today() {
        if (config.search && config.search.useDefaultTimezone) {
            return moment()
                .tz(config.defaultTimezone)
                .format('YYYY-MM-DD') + 'T00:00:00' + moment.tz(config.defaultTimezone).format('ZZ');
        }
        return moment().format('YYYY-MM-DD') + 'T00:00:00' + moment().format('ZZ');
    }

    /**
     * Copies the field values from source object to destination
     * if destination has a content profile then copies fields
     * defined in the content profile only
     */
    const copyMetadata = (source, destination) => {
        const fields = ['subject', 'anpa_category', 'headline',
            'urgency', 'priority', 'slugline', 'place'];

        destination.related_to = source._id;
        if (destination.profile) {
            return content.getType(destination.profile).then((type) => {
                fields.forEach((field) => {
                    if (type.schema.hasOwnProperty(field)) {
                        destination[field] = source[field];
                    }
                });
                return $q.when(destination);
            });
        }

        fields.forEach((field) => {
            destination[field] = source[field];
        });
        return $q.when(destination);
    };

    $scope.actions = {
        apply: {
            title: 'Associate metadata',
            method: function(item) {
                $scope.origItem = $scope.options.item;

                copyMetadata(item, {}).then((copied) => api.save('archive', $scope.origItem, copied)
                    .then(() => {
                        Object.assign($scope.options.item, copied);
                        notify.success(gettext('item metadata associated.'));
                        return item;
                    }));
            },
            class: 'open',
            icon: 'icon-expand',
            condition: function(item) {
                return item.type !== 'composite';
            },
        },
        update: {
            title: 'Associate as update',
            method: function(item) {
                api.save('archive_rewrite', {},
                    {update: angular.extend({}, $scope.origItem, $scope.item)},
                    item)
                    .then((newItem) => {
                        notify.success(gettext('Story is associated as update.'));
                        authoringWorkspace.edit(newItem);
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
                !$scope.item.rewrite_of && (!$scope.item.broadcast || !$scope.item.broadcast.master_id);

                var canBeRewritten = authoring.itemActions(item).re_write;

                return canBeRewritten && canBeRewrite && userHasPermission;
            },
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
            },
        },
    };

    BaseWidgetController.call(this, $scope);

    $scope.$watch('widget.configuration', (_config) => {
        if (_config && _config.sluglineMatch && _config.sluglineMatch !== $scope.itemListOptions.sluglineMatch) {
            $scope.itemListOptions.sluglineMatch = _config.sluglineMatch;
        }

        if (_config && _config.modificationDateAfter &&
            _config.modificationDateAfter !== $scope.itemListOptions.modificationDateAfter) {
            if (_config.modificationDateAfter === 'today') {
                $scope.itemListOptions.modificationDateAfter = today();
            } else {
                $scope.itemListOptions.modificationDateAfter = _config.modificationDateAfter;
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
