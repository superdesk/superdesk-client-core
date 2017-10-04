EditWorkspaceDirective.$inject = ['workspaces'];
export function EditWorkspaceDirective(workspaces) {
    return {
        templateUrl: 'scripts/apps/workspace/views/edit-workspace-modal.html',
        scope: {
            workspace: '=',
            done: '='
        },
        link: function(scope) {
            scope.workspaces = workspaces;

            /**
             * Trigger workspace.save and in case there is an error returned assign it to scope.
             */
            scope.save = function() {
                workspaces.save(scope.workspace)
                    .then(() => {
                        scope.errors = null;
                        var workspace = scope.workspace;

                        scope.workspace = null;
                        if (scope.done) {
                            return scope.done(workspace);
                        }
                    }, (response) => {
                        scope.errors = response.data._issues;
                    });
            };

            scope.cancel = function() {
                scope.workspace = null;
            };
        }
    };
}
