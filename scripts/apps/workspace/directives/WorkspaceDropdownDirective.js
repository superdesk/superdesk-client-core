import _ from 'lodash';

WorkspaceDropdownDirective.$inject = ['desks', 'workspaces', '$route', 'preferencesService', '$location',
    'reloadService', 'notifyConnectionService', 'deskNotifications', 'pageTitle'];
export function WorkspaceDropdownDirective(desks, workspaces, $route, preferencesService, $location, reloadService,
    notifyConnectionService, deskNotifications, pageTitle) {
    return {
        templateUrl: 'scripts/apps/workspace/views/workspace-dropdown.html',
        link: function(scope) {
            scope.workspaces = workspaces;
            scope.wsList = null;
            scope.edited = null;

            scope.$watch('selected', () => {
                pageTitle.setWorkspace(scope.selected ? scope.selected.name || '' : '');
            });

            scope.$on('$destroy', () => {
                pageTitle.setWorkspace('');
            });

            scope.afterSave = function(workspace) {
                desks.setCurrentDeskId(null);
                workspaces.setActive(workspace);
                scope.selected = workspace;
            };

            scope.selectDesk = function(desk) {
                reset();
                scope.selected = desk;
                scope.workspaceType = 'desk';
                desks.setCurrentDeskId(desk._id);
                workspaces.setActiveDesk(desk);
                reloadService.activeDesk = desks.active.desk;
            };

            scope.selectWorkspace = function(workspace) {
                reset();
                scope.selected = workspace;
                scope.workspaceType = 'workspace';
                desks.setCurrentDeskId(null);
                workspaces.setActive(workspace);
            };

            scope.createWorkspace = function() {
                scope.edited = {};
            };

            function reset() {
                desks.changeDesk = true;
                $location.search('_id', null);
            }

            /**
             * Restore the last desk/current workspace selection
             */
            function initialize() {
                var activeWorkspace = null;

                workspaces.getActiveId()
                    .then((workspace) => {
                        activeWorkspace = workspace;
                    })
                    .then(angular.bind(desks, desks.fetchCurrentUserDesks))
                    .then((userDesks) => {
                        scope.desks = userDesks;
                    })
                    .then(workspaces.queryUserWorkspaces)
                    .then((_workspaces) => {
                        scope.wsList = _workspaces;
                        scope.workspaceType = activeWorkspace.type;
                        if (activeWorkspace.type === 'desk') {
                            scope.selected = _.find(scope.desks, {_id: activeWorkspace.id}) || desks.getCurrentDesk();
                        } else if (activeWorkspace.type === 'workspace') {
                            scope.selected = _.find(scope.wsList, {_id: activeWorkspace.id});
                        } else {
                            scope.selected = null;
                        }
                    })
                    .then(() => {
                        deskNotifications.reload();
                    });
            }

            scope.$watch(() => workspaces.active, initialize, true);
        },
    };
}
