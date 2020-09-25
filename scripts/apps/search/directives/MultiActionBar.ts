import _ from 'lodash';
import {gettext} from 'core/utils';
import {showModal} from 'core/services/modalService';
import {getModalForMultipleHighlights} from 'apps/highlights/components/SetHighlightsForMultipleArticlesModal';
import {IArticleActionBulkExtended} from 'apps/monitoring/MultiActionBarReact';
import {IArticle} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {dataApi} from 'core/helpers/CrudManager';
import {canPrintPreview} from '../helpers';

interface IScope extends ng.IScope {
    multi: any;
    display: any;
    type: any;
    activity: any;
    export: boolean;
    spike: any;
    publish: any;
    state: any;
    printPreview: Array<IArticle>;
    action: {
        send: any;
        sendAs: any;
        canRemoveIngestItems: any;
        removeIngestItems: any;
        fetch: any;
        canEditMetadata: any;
        multiImageEdit: any;
        multiedit: any;
        openExport: any;
        spikeItems: any;
        unspikeItems: any;
        canPackageItems: any;
        canPublishItem: any;
        duplicateInPlace: any;
        duplicateTo: any;
        publish: any;
        createPackage: any;
        addToPackage: any;
        canHighlightItems: any;
    };
    toggleDisplay(): void;
    hideMultiActionBar(): void;
    hideMultiActionBar(): void;
    getActions(articles: Array<IArticle>): Array<IArticleActionBulkExtended>;
    openExport();
    isOpenItemType(type: any): boolean;
    closeExport(): void;
    closePrintPreview(): void;
}

MultiActionBar.$inject = [
    'asset', 'multi', 'authoringWorkspace', 'superdesk',
    'keyboardManager', 'desks', 'api', 'archiveService',
];
export function MultiActionBar(
    asset,
    multi,
    authoringWorkspace: AuthoringWorkspaceService,
    superdesk,
    keyboardManager,
    desks,
    api,
    archiveService,
) {
    return {
        controller: 'MultiActionBar',
        controllerAs: 'action',
        templateUrl: asset.templateUrl('apps/search/views/multi-action-bar.html'),
        scope: true,
        link: function(scope: IScope) {
            scope.multi = multi;
            scope.display = true;
            scope.$watch(multi.getItems, detectType);

            scope.printPreview = [];

            scope.closePrintPreview = () => {
                scope.printPreview = [];
            };

            scope.$watch('multi.count', () => {
                scope.display = true;
            });

            scope.toggleDisplay = () => {
                scope.display = !scope.display;
            };

            scope.hideMultiActionBar = () => {
                scope.display = multi.reset();
            };

            scope.getActions = (articles: Array<IArticle>): Array<IArticleActionBulkExtended> => {
                const actions: Array<IArticleActionBulkExtended> = [];

                if (scope.type === 'ingest') {
                    actions.push({
                        label: gettext('Fetch'),
                        icon: 'icon-archive',
                        onTrigger: () => {
                            scope.action.send();
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    });
                    actions.push({
                        label: gettext('Fetch to'),
                        icon: 'icon-fetch-as',
                        onTrigger: () => {
                            scope.action.sendAs();
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    });

                    if (scope.action.canRemoveIngestItems()) {
                        actions.push({
                            label: gettext('Remove'),
                            icon: 'icon-trash',
                            onTrigger: () => {
                                scope.action.removeIngestItems();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }
                } else if (scope.type === 'externalsource') {
                    actions.push({
                        label: gettext('Fetch'),
                        icon: 'icon-archive',
                        onTrigger: () => {
                            scope.action.fetch();
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    }, {
                        label: gettext('Fetch to'),
                        icon: 'icon-fetch-as',
                        onTrigger: () => {
                            scope.action.fetch(true);
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    });
                } else if (scope.type === 'archive') {
                    if (scope.action.canEditMetadata() && scope.activity['edit.item']) {
                        actions.push({
                            label: gettext('Edit metadata'),
                            icon: 'icon-edit-line',
                            onTrigger: () => {
                                scope.action.multiImageEdit();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }
                    if (scope.activity['export']) {
                        actions.push({
                            label: gettext('Export'),
                            icon: 'icon-download',
                            onTrigger: () => {
                                scope.openExport();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }
                    if (scope.activity['edit.item']) {
                        actions.push({
                            label: gettext('Multiedit'),
                            icon: 'icon-multiedit',
                            onTrigger: () => {
                                scope.action.multiedit();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }
                    if (!scope.spike && !scope.publish && scope.activity['spike']) {
                        actions.push({
                            label: gettext('Spike'),
                            icon: 'icon-trash',
                            onTrigger: () => {
                                scope.action.spikeItems();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }
                    if (scope.activity['edit.item']) {
                        actions.push({
                            label: gettext('Send to'),
                            icon: 'icon-expand-thin',
                            onTrigger: () => {
                                scope.action.sendAs();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }
                    if (scope.activity['edit.item'] && scope.action.canPublishItem()) {
                        actions.push({
                            label: gettext('Publish'),
                            icon: 'icon-ok',
                            onTrigger: () => {
                                scope.action.publish();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }
                } else if (scope.type === 'spike') {
                    actions.push({
                        label: gettext('Unspike'),
                        icon: 'icon-unspike',
                        onTrigger: () => {
                            scope.action.unspikeItems();
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    });
                }

                if (scope.action.canPackageItems()) {
                    actions.push({
                        label: gettext('Create Package'),
                        icon: 'icon-package-create',
                        onTrigger: () => {
                            scope.action.createPackage();
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    });

                    if (scope.isOpenItemType('composite')) {
                        actions.push({
                            label: gettext('Add to Current Package'),
                            icon: 'icon-package-plus',
                            onTrigger: () => {
                                scope.action.addToPackage();
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: false,
                        });
                    }

                    const currentDeskId = desks.getCurrentDeskId();

                    if (currentDeskId != null && scope.action.canHighlightItems()) {
                        actions.push({
                            label: gettext('Add to highlight'),
                            icon: 'icon-star',
                            onTrigger: () => {
                                showModal(getModalForMultipleHighlights(articles, currentDeskId));
                                scope.$apply();
                            },
                            canAutocloseMultiActionBar: true,
                        });
                    }
                }

                if (scope.activity['duplicateTo']) {
                    actions.push({
                        label: gettext('Duplicate To'),
                        icon: 'icon-copy',
                        group: {
                            label: gettext('Duplicate'),
                            icon: 'icon-copy',
                        },
                        onTrigger: () => {
                            scope.action.duplicateTo();
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    });
                }

                if (scope.activity['duplicateInPlace']) {
                    actions.push({
                        label: gettext('Duplicate In Place'),
                        icon: 'icon-copy',
                        group: {
                            label: gettext('Duplicate'),
                            icon: 'icon-copy',
                        },
                        onTrigger: () => {
                            scope.action.duplicateInPlace();
                            scope.$apply();
                        },
                        canAutocloseMultiActionBar: false,
                    });
                }

                if (articles.every((item) => canPrintPreview(item))) {
                    actions.push({
                        label: gettext('Print'),
                        icon: 'icon-print',
                        onTrigger: () => {
                            const ids: Array<string> = multi.getIds();

                            scope.hideMultiActionBar();

                            Promise.all(
                                ids.map((id) => dataApi.findOne<IArticle>('archive', id)),
                            ).then((res: Array<IArticle>) => {
                                scope.printPreview = res;
                                scope.$apply();
                            });
                        },
                        canAutocloseMultiActionBar: false,
                    });
                }

                return actions;
            };

            scope.$on('item:lock', (_e, data) => {
                if (_.includes(multi.getIds(), data.item)) {
                    // locked item is in the selections so update lock info
                    var selectedItems = multi.getItems();

                    _.find(selectedItems, (_item) => _item._id === data.item).lock_user = data.user;
                    detectType(selectedItems);
                }
            });

            scope.$on('item:unlock', (_e, data) => {
                if (multi.getIds().includes(data.item)) {
                    const selectedItems = multi.getItems();

                    // When selected items are unlocked update their lock info and allowed actions
                    api.find('archive', data.item).then((_item) => {
                        const index = selectedItems.findIndex((item) => item._id === _item._id);

                        selectedItems[index] = _.extend(selectedItems[index], _item);
                        detectType(selectedItems);
                    });
                }
            });

            scope.isOpenItemType = function(type) {
                var openItem = authoringWorkspace.getItem();

                return openItem && openItem.type === type;
            };

            scope.openExport = function() {
                scope.export = true;
            };

            scope.closeExport = function() {
                scope.export = false;
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
                    const type = archiveService.getType(item);

                    types[type] = 1;
                    states.push(item.state);

                    var _activities = superdesk.findActivities({action: 'list', type: type}, item) || [];
                    let allowOnSessionOwnerLock = ['spike', 'export'];

                    _activities.forEach((activity) => {
                        // Ignore activities if the item is locked (except those in allowOnSessionOwnerLock)
                        if (!item.lock_user || allowOnSessionOwnerLock.indexOf(activity._id) >= 0) {
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

            keyboardManager.bind('ctrl+shift+#', () => {
                if (scope.activity.spike > 0) {
                    scope.action.spikeItems();
                }
            });
        },
    };
}
