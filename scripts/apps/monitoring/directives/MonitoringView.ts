import _ from 'lodash';
import {gettext} from 'core/utils';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {IDesk} from 'superdesk-api';

interface IScope extends ng.IScope {
    monitoringItemsLoading: boolean;
    activeDeskId: IDesk['_id'] | null;
    swimlane: any;
    monitoring: any;
    numberOfColumns: number;
    desks: any;
    workspaces: any;
    view: string;
    workspace: any;
    shouldRefresh: boolean;
    type: any;
    group: any;
    refreshGroup(group?: any);
    isActiveGroup: (group: any) => boolean;
    switchView: (value: any, swimlane?: any) => void;
    gettext: (text: any, params?: any) => any;
    toggleFilter: () => void;
    addResourceUpdatedEventListener: (callback: any) => void;
    openUpload: (files: Array<File>) => void;
}

/**
 * Main monitoring view - list + preview
 *
 * it's a directive so that it can be put together with authoring into some container directive
 */
MonitoringView.$inject = [
    '$rootScope',
    'authoringWorkspace',
    'pageTitle',
    '$timeout',
    'workspaces',
    'desks',
    'superdesk',
];

export function MonitoringView(
    $rootScope,
    authoringWorkspace: AuthoringWorkspaceService,
    pageTitle,
    $timeout,
    workspaces,
    desks,
    superdesk,
) {
    return {
        templateUrl: 'scripts/apps/monitoring/views/monitoring-view.html',
        controller: 'Monitoring',
        controllerAs: 'monitoring',
        scope: {
            type: '=',
            state: '=',
            customDataSource: '=?',
            onMonitoringItemSelect: '=?',
            onMonitoringItemDoubleClick: '=?',
            hideActionsForMonitoringItems: '=?',
            disableMonitoringMultiSelect: '=?',
            disableMonitoringCreateItem: '=?',
            hideMonitoringToolbar1: '=?',
            hideMonitoringToolbar2: '=?',
        },
        link: function(scope: IScope, elem) {
            let containerElem = elem.find('.sd-column-box__main-column');

            scope.gettext = gettext;

            scope.$watch(() => desks.active.desk, (activeDeskId) => {
                scope.activeDeskId = activeDeskId;
            });

            scope.addResourceUpdatedEventListener = (callback) => {
                scope.$on('resource:updated', (_event, data) => {
                    callback(data);
                });
            };

            scope.openUpload = (files: Array<File>) => {
                superdesk.intent('upload', 'media', {
                    files: files,
                    deskSelectionAllowed: true,
                });
            };

            /**
             * Issue here is that sd-column-box__main-column element is not visible on initializing sd-monitoring-view.
             * So I added $broadcast and listener for updating onScroll binding and containerElem for it.
            */
            $rootScope.$on('stage:single', () => {
                containerElem = elem.find('.sd-column-box__main-column');
                containerElem.on('scroll', handleContainerScroll);
            });

            pageTitle.setUrl(_.capitalize(gettext(scope.type)));

            scope.shouldRefresh = true;
            scope.view = 'compact'; // default view

            scope.workspaces = workspaces;
            scope.$watch('workspaces.active', (workspace) => {
                scope.workspace = workspace;
            });
            workspaces.getActive();

            scope.desks = desks;
            scope.$watch(desks.getCurrentDesk.bind(desks), (currentDesk: any) => {
                if (currentDesk && currentDesk.monitoring_default_view) {
                    switch (currentDesk.monitoring_default_view) {
                    case 'list':
                        scope.switchView('compact');
                        break;
                    case 'swimlane':
                        scope.switchView('compact', true);
                        break;
                    case 'photogrid':
                        scope.switchView('photogrid');
                        break;
                    default:
                        scope.switchView('compact'); // list by default
                        break;
                    }
                }
            });

            scope.numberOfColumns = 1;

            /**
             * Toggle viewColumn to switch views between swimlane and list
             * @param {Boolean} value
             * @param {Boolean} swimlane
             */
            scope.switchView = function(value, swimlane) {
                scope.monitoring.switchViewColumn(swimlane, true);
                scope.view = value;
                scope.swimlane = swimlane;
            };

            /**
             * @description Returns true when group's item is selected for previewing, false otherwise.
             * @param {Object} group
             * @returns {Boolean}
             */
            scope.isActiveGroup = function(group) {
                return scope.monitoring.selectedGroup ? scope.monitoring.selectedGroup._id === group._id : true;
            };

            var updateTimeout;

            function handleContainerScroll($event) {
                if ($rootScope.itemToggle) {
                    scope.$applyAsync(() => {
                        $rootScope.itemToggle(false);
                        $rootScope.itemToggle = null;
                    });
                }

                if (scope.monitoring.viewColumn && containerElem[0].scrollTop === 0) {
                    scope.refreshGroup(scope.group);
                }

                $timeout.cancel(updateTimeout);
                updateTimeout = $timeout(renderIfNeeded, 100, false);
            }

            containerElem.on('scroll', handleContainerScroll);

            function isListEnd(container) {
                return container.scrollTop + container.offsetHeight + 200 >= container.scrollHeight;
            }

            /**
             * Trigger render in case user scrolls to the very end of list
             */
            function renderIfNeeded() {
                if (isListEnd(containerElem[0])) {
                    scheduleFetchNext();
                }
            }

            let fetchNextTimeout;

            /**
             * Schedule content fetchNext after some delay
             */
            function scheduleFetchNext() {
                if (!fetchNextTimeout) {
                    fetchNextTimeout = $timeout(() => {
                        scope.$broadcast('render:next');
                        scope.$applyAsync(() => {
                            fetchNextTimeout = null;
                        });
                    }, 1000, false);
                }
            }

            // force refresh on refresh button click when in specific view such as single, highlights or spiked.
            scope.refreshGroup = function(group) {
                scope.$broadcast('refresh:list', group);
            };

            scope.$on('$destroy', () => {
                containerElem.off();
            });

            scope.$on('$routeUpdate', (event, data) => {
                if (scope.shouldRefresh) {
                    scope.refreshGroup();
                } else {
                    scope.shouldRefresh = true;
                }
            });

            scope.$watch(() => authoringWorkspace.item, (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    scope.shouldRefresh = false; // when item opened or closed
                    if (newValue) { // when item opened
                        scope.monitoring.closePreview();
                    }
                }
            });
        },
    };
}
