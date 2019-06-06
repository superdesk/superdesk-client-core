import _ from 'lodash';
import {gettext} from 'core/utils';
import {IArticleActionBulk} from 'superdesk-api';

MultiActionBar.$inject = ['asset', 'multi', 'authoringWorkspace', 'superdesk', 'keyboardManager'];
export function MultiActionBar(asset, multi, authoringWorkspace, superdesk, keyboardManager) {
    return {
        controller: 'MultiActionBar',
        controllerAs: 'action',
        templateUrl: asset.templateUrl('apps/search/views/multi-action-bar.html'),
        scope: true,
        link: function(scope) {
            scope.multi = multi;
            scope.display = true;
            scope.$watch(multi.getItems, detectType);

            scope.$watch('multi.count', () => {
                scope.display = true;
            });

            scope.toggleDisplay = () => {
                scope.display = !scope.display;
            };

            scope.hideMultiActionBar = () => {
                scope.display = multi.reset();
            };

            scope.getActions = (): Array<IArticleActionBulk> => {
                const actions = [];

                if (scope.action.canPackageItems()) {
                    actions.push({
                        label: gettext('Create Package'),
                        icon: 'icon-package-create',
                        onTrigger: () => {
                            scope.action.createPackage();
                            scope.$apply();
                        },
                    });

                    if (scope.isOpenItemType('composite')) {
                        actions.push({
                            label: gettext('Add to Current Package'),
                            icon: 'icon-package-plus',
                            onTrigger: () => {
                                scope.action.addToPackage();
                                scope.$apply();
                            },
                        });
                    }

                    if (scope.action.canHighlightItems()) {
                        actions.push({
                            label: gettext('Add to highlight'),
                            icon: 'icon-star',
                            onTrigger: () => {
                                alert('not implemented');
                                // sd-multi-mark-highlights-dropdown
                                scope.$apply();
                            },
                        });
                    }
                }

                if (scope.type === 'archive') {
                    if (scope.activity['edit.item']) {
                        actions.push({
                            label: gettext('Multiedit'),
                            icon: 'icon-multiedit',
                            onTrigger: () => {
                                scope.action.multiedit();
                                scope.$apply();
                            },
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
                        });
                    }
                    if (scope.state === 'spiked') {
                        actions.push({
                            label: gettext('Unspike'),
                            icon: 'icon-unspike',
                            onTrigger: () => {
                                scope.action.unspikeItems();
                                scope.$apply();
                            },
                        });
                    }
                    if (scope.action.canEditMetadata() && scope.activity['edit.item']) {
                        actions.push({
                            label: gettext('Edit metadata'),
                            icon: 'icon-edit-line',
                            onTrigger: () => {
                                scope.action.multiImageEdit();
                                scope.$apply();
                            },
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
                        });
                    }
                    if (scope.activity['edit.item'] && scope.state !== 'draft') {
                        actions.push({
                            label: gettext('Publish'),
                            icon: 'icon-ok',
                            onTrigger: () => {
                                scope.action.publish();
                                scope.$apply();
                            },
                        });
                    }
                } else if (scope.type === 'ingest') {
                    actions.push({
                        label: gettext('Fetch'),
                        icon: 'icon-archive',
                        onTrigger: () => {
                            scope.action.send();
                            scope.$apply();
                        },
                    });
                    actions.push({
                        label: gettext('Fetch to'),
                        icon: 'icon-fetch-as',
                        onTrigger: () => {
                            scope.action.sendAs();
                            scope.$apply();
                        },
                    });

                    if (scope.action.canRemoveIngestItems()) {
                        actions.push({
                            label: gettext('Remove'),
                            icon: 'icon-trash',
                            onTrigger: () => {
                                scope.action.removeIngestItems();
                                scope.$apply();
                            },
                        });
                    }
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
                    types[item._type] = 1;
                    states.push(item.state);

                    var _activities = superdesk.findActivities({action: 'list', type: item._type}, item) || [];
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
