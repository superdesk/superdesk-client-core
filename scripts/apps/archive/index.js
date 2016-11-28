//styles
import './styles/related-item.scss';

//scripts
import './related-item-widget/relatedItem';

import * as directive from './directives';
import * as svc from './services';
import * as ctrl from './controllers';

angular.module('superdesk.apps.archive.directives', [
    'superdesk.core.filters',
    'superdesk.apps.authoring',
    'superdesk.apps.ingest',
    'superdesk.core.workflow'
])
    .directive('sdItemLock', directive.ItemLock)
    .directive('sdItemState', directive.ItemState)
    .directive('sdInlineMeta', directive.InlineMeta)
    .directive('sdMediaPreview', directive.MediaPreview)
    .directive('sdMediaPreviewWidget', directive.MediaPreviewWidget)
    .directive('sdItemPreviewContainer', directive.ItemPreviewContainer)
    .directive('sdMediaView', directive.MediaView)
    .directive('sdMediaMetadata', directive.MediaMetadata)
    .directive('sdMediaRelated', directive.MediaRelated)
    .directive('sdFetchedDesks', directive.FetchedDesks)
    .directive('sdMetaIngest', directive.MetaIngest)
    .directive('sdSingleItem', directive.SingleItem)
    .directive('sdDraggableItem', directive.DraggableItem)
    .directive('sdItemCrops', directive.ItemCrops)
    .directive('sdItemRendition', directive.ItemRendition)
    .directive('sdRatioCalc', directive.RatioCalc)
    .directive('sdHtmlPreview', directive.HtmlPreview)
    .directive('sdProviderMenu', directive.ProviderMenu)
    .directive('sdGridLayout', directive.GridLayout)
    .directive('sdContentResults', directive.ContentResults)
    .directive('sdArchivedItemKill', directive.ArchivedItemKill)
    .directive('sdResendItem', directive.ResendItem)
    .directive('sdItemPriority', directive.ItemPriority)
    .directive('sdItemUrgency', directive.ItemUrgency)

    .service('familyService', svc.FamilyService)
    .service('dragitem', svc.DragItemService);

/**
 * @ngdoc module
 * @module superdesk.apps.archive
 * @name superdesk.apps.archive
 * @packageName superdesk.apps
 * @description Superdesk archive specific application.
 */
angular.module('superdesk.apps.archive', [
    'superdesk.apps.search',
    'superdesk.apps.archive.directives',
    'superdesk.apps.dashboard',
    'superdesk.apps.dashboard.widgets.base',
    'superdesk.apps.dashboard.widgets.relatedItem'
])

    .service('spike', svc.SpikeService)
    .service('multi', svc.MultiService)
    .service('archiveService', svc.ArchiveService)

    .controller('UploadController', ctrl.UploadController)
    .controller('ArchiveListController', ctrl.ArchiveListController)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/workspace/content', {
                label: gettext('Workspace'),
                priority: 100,
                controller: 'ArchiveListController',
                templateUrl: 'scripts/apps/archive/views/list.html',
                topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                filters: [
                    {action: 'view', type: 'content'}
                ],
                privileges: {archive: 1}
            })
            .activity('upload.media', {
                label: gettext('Upload media'),
                modal: true,
                cssClass: 'upload-media modal-responsive',
                controller: ctrl.UploadController,
                templateUrl: 'scripts/apps/archive/views/upload.html',
                filters: [
                    {action: 'upload', type: 'media'}
                ],
                privileges: {archive: 1}
            })
            .activity('spike', {
                label: gettext('Spike Item'),
                icon: 'trash',
                monitor: true,
                controller: ['spike', 'data', '$rootScope', 'modal', '$location', '$q',
                    function spikeActivity(spike, data, $rootScope, modal, $location, $q) {
                        var txt = gettext('Do you want to delete the item permanently?');
                        var isPersonal = $location.path() === '/workspace/personal';

                        return $q.when(isPersonal ? modal.confirm(txt) : 0)
                            .then(function() {
                                return spike.spike(data.item).then(function(item) {
                                    $rootScope.$broadcast('item:spike');
                                    return item;
                                });
                            });
                    }],
                filters: [{action: 'list', type: 'archive'}],
                action: 'spike',
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).spike;
                }]
            })
            .activity('unspike', {
                label: gettext('Unspike Item'),
                icon: 'unspike',
                monitor: true,
                controller: ['spike', 'data', '$rootScope', function unspikeActivity(spike, data, $rootScope) {
                    return spike.unspike(data.item).then(function(item) {
                        $rootScope.$broadcast('item:unspike');
                        return item;
                    });
                }],
                filters: [{action: 'list', type: 'spike'}],
                action: 'unspike',
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).unspike;
                }]
            })
            .activity('duplicate', {
                label: gettext('Duplicate'),
                icon: 'copy',
                monitor: true,
                controller: ctrl.DuplicateController,
                filters: [{action: 'list', type: 'archive'}],
                keyboardShortcut: 'ctrl+d',
                privileges: {duplicate: 1},
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).duplicate;
                }]
            })
            .activity('createBroadcast', {
                label: gettext('Create Broadcast'),
                icon: 'broadcast',
                monitor: true,
                controller: ['api', 'notify', '$rootScope', 'data', 'desks', 'authoringWorkspace',
                    function(api, notify, $rootScope, data, desks, authoringWorkspace) {
                        api.save('archive_broadcast', {}, {desk: desks.getCurrentDeskId()}, data.item)
                        .then(function(broadcastItem) {
                            authoringWorkspace.edit(broadcastItem);
                            $rootScope.$broadcast('broadcast:created', {item: data.item});
                        });
                    }],
                filters: [{action: 'list', type: 'archive'}],
                keyboardShortcut: 'ctrl+b',
                privileges: {archive_broadcast: 1},
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).create_broadcast;
                }]
            })
            .activity('copy', {
                label: gettext('Copy'),
                icon: 'copy',
                monitor: true,
                controller: ['api', 'data', '$rootScope', function(api, data, $rootScope) {
                    api
                        .save('copy', {}, {}, data.item)
                        .then(function(archiveItem) {
                            data.item.task_id = archiveItem.task_id;
                            data.item.created = archiveItem._created;
                            $rootScope.$broadcast('item:copy');
                        }, function(response) {
                            data.item.error = response;
                        })
                        .finally(function() {
                            data.item.actioning.archiveContent = false;
                        });
                }],
                filters: [{action: 'list', type: 'archive'}],
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).copy;
                }]
            })
            .activity('newtake', {
                label: gettext('New Take'),
                icon: 'new-doc',
                filters: [{action: 'list', type: 'archive'}],
                keyboardShortcut: 'ctrl+alt+t',
                privileges: {archive: 1},
                additionalCondition: ['authoring', 'item', 'config', function(authoring, item, config) {
                    return authoring.itemActions(item).new_take && !(config.features && config.features.noTakes);
                }],
                controller: ['data', '$rootScope', 'desks', 'authoring', 'authoringWorkspace', 'notify', 'superdesk',
                    function(data, $rootScope, desks, authoring, authoringWorkspace, notify) {
                        // get the desk of the item to create the new take.
                        var deskId = null;
                        deskId = desks.getCurrentDeskId();

                        if (!deskId) {
                            notify.error(gettext('Desk not specified. ' +
                                'Please select Desk or configure a default desk.'));
                            return;
                        }

                        authoring.linkItem(data.item, null, deskId)
                            .then(function(item) {
                                notify.success(gettext('New take created.'));
                                $rootScope.$broadcast('item:take');
                                authoringWorkspace.edit(item);
                            }, function(response) {
                                data.item.error = response;
                                notify.error(gettext('Failed to generate new take.'));
                            });
                    }]
            })
            .activity('resend', {
                label: gettext('Resend item'),
                priority: 100,
                icon: 'share-alt',
                group: 'corrections',
                controller: ['data', '$rootScope', function(data, $rootScope) {
                    $rootScope.$broadcast('open:resend', data.item);
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).resend;
                }],
                privileges: {resend: 1}
            })
            .activity('rewrite', {
                label: gettext('Update'),
                icon: 'edit-line',
                filters: [{action: 'list', type: 'archive'}],
                group: 'corrections',
                privileges: {rewrite: 1},
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).re_write;
                }],
                controller: ['data', 'authoring', function(data, authoring) {
                    authoring.rewrite(data.item);
                }]
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('copy', {
            type: 'http',
            backend: {
                rel: 'copy'
            }
        });
        apiProvider.api('duplicate', {
            type: 'http',
            backend: {
                rel: 'duplicate'
            }
        });
        apiProvider.api('notification', {
            type: 'http',
            backend: {
                rel: 'notification'
            }
        });
        apiProvider.api('archive', {
            type: 'http',
            backend: {
                rel: 'archive'
            }
        });
        apiProvider.api('archive_rewrite', {
            type: 'http',
            backend: {
                rel: 'archive_rewrite'
            }
        });
    }]);
