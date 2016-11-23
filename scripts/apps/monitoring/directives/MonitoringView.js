/**
 * Main monitoring view - list + preview
 *
 * it's a directive so that it can be put together with authoring into some container directive
 */
MonitoringView.$inject = ['$rootScope', 'authoringWorkspace', 'pageTitle', '$timeout'];
export function MonitoringView($rootScope, authoringWorkspace, pageTitle, $timeout) {
    return {
        templateUrl: 'scripts/apps/monitoring/views/monitoring-view.html',
        controller: 'Monitoring',
        controllerAs: 'monitoring',
        scope: {
            type: '=',
            state: '='
        },
        link: function(scope, elem) {

            var containerElem = elem.find('.content-list');
            containerElem.on('scroll', handleContainerScroll);
            pageTitle.setUrl(_.capitalize(gettext(scope.type)));

            scope.viewColumn = scope.monitoring.viewColumn;

            /**
             * Toggle viewColumn to switch views between swimlane and list
             */
            scope.displayColumn = function() {
                scope.viewColumn = !scope.viewColumn;
                scope.monitoring.switchView(scope.viewColumn);
                scope.$broadcast('view:column', {viewColumn: scope.viewColumn});
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
                if ($rootScope.itemToogle) {
                    scope.$applyAsync(function() {
                        $rootScope.itemToogle(false);
                        $rootScope.itemToogle = null;
                    });
                }

                // If scroll bar leaves top position update scope.scrollTop
                // which is used to display refresh button on list item updates
                if ($event.currentTarget.scrollTop >= 0 && $event.currentTarget.scrollTop < 100) {
                    scope.$applyAsync(function() {
                        scope.scrollTop = scope.monitoring.scrollTop = $event.currentTarget.scrollTop;

                        // force refresh the group or list, if scroll bar hits the top of list.
                        if (scope.monitoring.scrollTop === 0) {
                            scope.$broadcast('refresh:list', scope.group);
                        }
                    });
                }

                $timeout.cancel(updateTimeout);
                updateTimeout = $timeout(renderIfNeeded($event), 100, false);
            }

            function isListEnd(containerElem) {
                return containerElem.scrollTop + containerElem.offsetHeight + 200 >= containerElem.scrollHeight;
            }

            /**
             * Trigger render in case user scrolls to the very end of list
             */
            function renderIfNeeded($event) {
                if (scope.viewColumn && isListEnd($event.currentTarget)) {
                    scheduleFetchNext();
                }
            }

            let fetchNextTimeout;

            /**
             * Schedule content fetchNext after some delay
             */
            function scheduleFetchNext() {
                if (!fetchNextTimeout) {
                    fetchNextTimeout = $timeout(function() {
                        scope.$broadcast('render:next');
                        scope.$applyAsync(function() {
                            fetchNextTimeout = null;
                        });
                    }, 1000, false);
                }
            }

            // force refresh on refresh button click when in specific view such as single, highlights or spiked.
            scope.refreshGroup = function(group) {
                containerElem[0].scrollTop = 0;
                scope.$broadcast('refresh:list', group);
            };

            scope.$on('$destroy', function() {
                containerElem.off('scroll');
            });

            scope.$watch(function() {
                return authoringWorkspace.item;
            }, function(item) {
                if (item) {
                    scope.monitoring.closePreview();
                }
            });
        }
    };
}
