/**
 * Main monitoring view - list + preview
 *
 * it's a directive so that it can be put together with authoring into some container directive
 */
MonitoringView.$inject = ['$rootScope', 'authoringWorkspace', 'pageTitle'];
export function MonitoringView($rootScope, authoringWorkspace, pageTitle) {
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

            function handleContainerScroll() {
                if ($rootScope.itemToogle) {
                    scope.$applyAsync(function() {
                        $rootScope.itemToogle(false);
                        $rootScope.itemToogle = null;
                    });
                }
            }

            // force refresh on refresh button click when in specific view such as single, highlights or spiked.
            scope.refreshGroup = function(group) {
                $rootScope.$broadcast('refresh:list', group);
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
