// styles
import './styles/related-item.scss';
import './styles/assignment.scss';
import './styles/html-preview.scss';
import {get, includes, flatMap} from 'lodash';

// scripts
import './related-item-widget/relatedItem';

import * as directive from './directives';
import * as svc from './services';
import * as ctrl from './controllers';

import {gettext} from 'core/utils';

import React from 'react';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {extensions} from 'core/extension-imports.generated';

import {IExtensionActivationResult, onSpikeMiddlewareResult} from 'superdesk-api';

angular.module('superdesk.apps.archive.directives', [
    'superdesk.core.filters',
    'superdesk.apps.authoring',
    'superdesk.apps.ingest',
    'superdesk.core.workflow',
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
    .directive('sdContentResults', directive.ContentResults)
    .directive('sdArchivedItemKill', directive.ArchivedItemKill)
    .directive('sdResendItem', directive.ResendItem)
    .directive('sdItemPriority', directive.ItemPriority)
    .directive('sdItemUrgency', directive.ItemUrgency)
    .directive('sdMarkedItemTitle', directive.MarkedItemTitle)
    .directive('sdExport', directive.Export)
    .directive('sdAssociatedItemMetadata', directive.AssociatedItemMetadata)
    .directive('sdMediaUsed', directive.MediaUsed)
    .directive('sdPackageItemLabelsDropdown', directive.PackageItemLabelsDropdown)
    .directive('sdAssignmentIcon', directive.AssignmentIcon)
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
    'superdesk.apps.dashboard.widgets.relatedItem',
    'superdesk.apps.workspace.menu',
])

    .service('spike', svc.SpikeService)
    .service('multi', svc.MultiService)
    .service('archiveService', svc.ArchiveService)

    .controller('UploadController', ctrl.UploadController)
    .controller('UploadAttachmentsController', ctrl.UploadAttachmentsController)
    .controller('ArchiveListController', ctrl.ArchiveListController)

    .config(['superdeskProvider', 'workspaceMenuProvider', function(superdesk, workspaceMenuProvider) {
        superdesk
            .activity('/workspace/content', {
                label: gettext('Workspace'),
                priority: 100,
                controller: 'ArchiveListController',
                templateUrl: 'scripts/apps/archive/views/list.html',
                topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
                sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
                filters: [
                    {action: 'view', type: 'content'},
                ],
                privileges: {archive: 1},
            })
            .activity('upload.media', {
                label: gettext('Upload media'),
                modal: true,
                cssClass: 'upload-media modal--fullscreen modal--dark-ui',
                controller: ctrl.UploadController,
                templateUrl: 'scripts/apps/archive/views/upload.html',
                filters: [
                    {action: 'upload', type: 'media'},
                ],
                additionalCondition: ['$location', function($location) {
                    return $location.path() !== '/planning';
                }],
                privileges: {archive: 1},
            })
            .activity('upload.attachments', {
                label: gettext('Attach files'),
                modal: true,
                cssClass: 'upload-media edit-attachments modal--z-index-fix modal--fill',
                controller: ctrl.UploadAttachmentsController,
                templateUrl: 'scripts/apps/archive/views/upload-attachments.html',
                filters: [
                    {action: 'upload', type: 'attachments'},
                ],
                privileges: {archive: 1},
            })
            .activity('spike', {
                label: gettext('Spike Item'),
                icon: 'trash',
                monitor: true,
                controller: spikeActivity,
                filters: [{action: 'list', type: 'archive'}],
                action: 'spike',
                keyboardShortcut: 'ctrl+shift+#',
                additionalCondition: ['session', 'authoring', 'item', function(session, authoring, item) {
                    return authoring.itemActions(item).spike &&
                        (item.lock_user === null || angular.isUndefined(item.lock_user) ||
                        item.lock_user === session.identity._id);
                }],
            })
            .activity('unspike', {
                label: gettext('Unspike Item'),
                icon: 'unspike',
                monitor: true,
                controller: ['spike', 'data', '$rootScope', function unspikeActivity(spike, data, $rootScope) {
                    return spike.unspike(data.item).then((item) => {
                        $rootScope.$broadcast('item:unspike');
                        return item;
                    });
                }],
                filters: [{action: 'list', type: 'spike'}],
                action: 'unspike',
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).unspike;
                }],
            })
            .activity('duplicateInPlace', {
                label: gettext('Duplicate in place'),
                icon: 'copy',
                monitor: true,
                controller: ctrl.DuplicateController,
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'list', type: 'archived'},
                ],
                keyboardShortcut: 'ctrl+alt+d',
                privileges: {duplicate: 1},
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).duplicate &&
                        (item.state !== 'killed' || item.state !== 'recalled');
                }],
                group: 'duplicate',
                groupLabel: gettext('Duplicate'),
                groupIcon: 'copy',
            })
            .activity('duplicateTo', {
                label: gettext('Duplicate To'),
                icon: 'copy',
                monitor: true,
                controller: ['data', 'send', function(data, send) {
                    return send.allAs([data.item], 'duplicateTo');
                }],
                filters: [
                    {action: 'list', type: 'archive'},
                    {action: 'list', type: 'archived'},
                ],
                keyboardShortcut: 'ctrl+alt+r',
                privileges: {duplicate: 1},
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return (item.state !== 'killed' || item.state !== 'recalled') &&
                        !authoring.isContentApiItem(item) && authoring.itemActions(item).duplicate;
                }],
                group: 'duplicate',
                groupLabel: gettext('Duplicate'),
                groupIcon: 'copy',
            })
            .activity('label', {
                label: gettext('Set label in current package'),
                priority: 30,
                icon: 'label',
                monitor: true,
                list: false,
                keyboardShortcut: 'ctrl+alt+l',
                filters: [{action: 'list', type: 'archive'}],
                group: 'labels',
                dropdown: true,
                templateUrl: 'scripts/apps/archive/views/package_item_labels_dropdown.html',
                additionalCondition: ['authoring', 'item', 'vocabularies', 'authoringWorkspace', 'packages',
                    function(authoring, item, vocabularies, authoringWorkspace, packages) {
                        var openedItem = authoringWorkspace.getItem();

                        return (item.state !== 'killed' || item.state !== 'recalled') &&
                            !authoring.isContentApiItem(item) && authoring.itemActions(item).set_label &&
                            openedItem && openedItem.type === 'composite' &&
                            packages.isAdded(openedItem, item) && vocabularies.isInit();
                    }],
            })
            .activity('createBroadcast', {
                label: gettext('Create Broadcast'),
                icon: 'broadcast',
                monitor: true,
                controller: ['api', 'notify', '$rootScope', 'data', 'desks', 'authoringWorkspace',
                    function(api, notify, $rootScope, data, desks, authoringWorkspace) {
                        api.save('archive_broadcast', {}, {desk: desks.getCurrentDeskId()}, data.item)
                            .then((broadcastItem) => {
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
                }],
            })
            .activity('copy', {
                label: gettext('Copy'),
                icon: 'copy',
                monitor: true,
                controller: ['api', 'data', '$rootScope', function(api, data, $rootScope) {
                    return api.save('copy', {}, {}, data.item)
                        .then((archiveItem) => {
                            data.item.task_id = archiveItem.task_id;
                            data.item.created = archiveItem._created;
                            $rootScope.$broadcast('item:copy');
                        }, (response) => {
                            data.item.error = response;
                        })
                        .finally(() => {
                            if (data.item.actioning) {
                                data.item.actioning.archiveContent = false;
                            }
                        });
                }],
                filters: [{action: 'list', type: 'archive'}],
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).copy;
                }],
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
                privileges: {resend: 1},
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
                }],
            })
            .activity('unlinkRewrite', {
                label: gettext('Unlink update'),
                icon: 'remove-sign',
                filters: [{action: 'list', type: 'archive'}],
                group: 'corrections',
                privileges: {rewrite: 1},
                condition: function(item) {
                    return item.lock_user === null || angular.isUndefined(item.lock_user);
                },
                additionalCondition: ['authoring', 'item', function(authoring, item) {
                    return authoring.itemActions(item).unlinkUpdate;
                }],
                controller: ['data', 'authoring', function(data, authoring) {
                    authoring.unlink(data.item);
                }],
            })
            .activity('export', {
                label: gettext('Export'),
                icon: 'download',
                templateUrl: 'scripts/apps/archive/views/export-dropdown.html',
                filters: [{action: 'list', type: 'archive'}],
                privileges: {content_export: 1},
                additionalCondition: ['config', 'session', 'authoring', 'item',
                    function(config, session, authoring, item) {
                        let lockCond = item.lock_user === null || angular.isUndefined(item.lock_user) ||
                            item.lock_user === session.identity._id;

                        return lockCond && authoring.itemActions(item).export;
                    }],
                modal: true,
                cssClass: 'modal-responsive',
                controller: ['$scope', function($scope) {
                    $scope.export = true;
                    $scope.item = $scope.locals.data.item;

                    $scope.closeExport = function() {
                        $scope.export = false;
                        $scope.reject();
                    };
                }],
            });

        workspaceMenuProvider.item({
            href: '/workspace/content',
            label: gettext('Content'),
            icon: 'archive',
            if: 'workspaceConfig.content && privileges.archive',
            order: 700,
        });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('copy', {
            type: 'http',
            backend: {
                rel: 'copy',
            },
        });
        apiProvider.api('duplicate', {
            type: 'http',
            backend: {
                rel: 'duplicate',
            },
        });
        apiProvider.api('notification', {
            type: 'http',
            backend: {
                rel: 'notification',
            },
        });
        apiProvider.api('archive', {
            type: 'http',
            backend: {
                rel: 'archive',
            },
        });
        apiProvider.api('archive_rewrite', {
            type: 'http',
            backend: {
                rel: 'archive_rewrite',
            },
        });
    }]);

spikeActivity.$inject = [
    'spike',
    'data',
    'modal',
    '$location',
    '$q',
    'multi',
    'privileges',
    'authoringWorkspace',
    'confirm',
    'autosave',
    'config',
];

function spikeActivity(spike, data, modal, $location, $q, multi, privileges,
    authoringWorkspace, confirm, autosave, config) {
    // For the sake of keyboard shortcut to work consistently,
    // if the item is multi-selected, let multibar controller handle its spike
    if (!data.item || multi.count > 0 && includes(multi.getIds(), data.item._id)) {
        return;
    }

    if (data.item.lock_user) { // current user has the lock
        return autosave.get(data.item)
            .then(() => confirm.reopen())
            .then(() => authoringWorkspace.edit(data.item))
            .catch(_spike);
    }

    _spike();

    function _spike() {
        if ($location.path() === '/workspace/personal') {
            return modal.confirm(gettext('Do you want to delete the item permanently?'), gettext('Confirm'))
                .then(() => spike.spike(data.item));
        }

        const onSpikeMiddlewares
            : Array<IExtensionActivationResult['contributions']['middlewares']['archive']['onSpike']>
            = flatMap(
                Object.values(extensions).map(({activationResult}) => activationResult),
                (activationResult) =>
                    activationResult.contributions != null
                    && activationResult.contributions.middlewares != null
                    && activationResult.contributions.middlewares.archive != null
                    && activationResult.contributions.middlewares.archive.onSpike != null
                        ? activationResult.contributions.middlewares.archive.onSpike
                        : [],
            );

        let warnings: onSpikeMiddlewareResult['warnings'] = [];
        var initialValue: Promise<onSpikeMiddlewareResult> = Promise.resolve({item: data.item});

        onSpikeMiddlewares.reduce(
            (current, next) => {
                return current.then((result) => {
                    if (result.warnings != null) {
                        warnings = warnings.concat(result.warnings);
                    }
                    return next(result.item);
                });
            },
            initialValue,
        )
        .then((result) => { // last result isn't processed by `reduce`
            if (result.warnings != null) {
                warnings = warnings.concat(result.warnings);
            }

            return result;
        })
        .then(() => {
            if (!get(config, 'confirm_spike', true) && warnings.length < 1) {
                spike.spike(data.item);
            } else {
                modal.createCustomModal()
                    .then(({openModal, closeModal}) => {
                        openModal(
                            <Modal>
                                <ModalHeader>{gettext('Confirm')}</ModalHeader>
                                <ModalBody>
                                    <div>{gettext('Are you sure you want to spike the item?')}</div>
                                    {
                                        warnings.length < 1 ? null : (
                                            <ul style={{listStyle: 'initial', paddingLeft: 40}}>
                                                {
                                                    warnings.map(({text}, i) => <li key={i}>{text}</li>)
                                                }
                                            </ul>
                                        )
                                    }
                                </ModalBody>
                                <ModalFooter>
                                    <button className="btn" onClick={closeModal}>{gettext('Cancel')}</button>
                                    <button
                                        className="btn btn--primary"
                                        onClick={() => {
                                            spike.spike(data.item)
                                                .then(closeModal);
                                        }}
                                    >
                                        {gettext('Spike')}
                                    </button>
                                </ModalFooter>
                            </Modal>,
                        );
                    });
            }
        });
    }
}
