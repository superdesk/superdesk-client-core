import {AuthoringWorkspaceService} from '../services/AuthoringWorkspaceService';

AuthoringContainerDirective.$inject = ['authoringWorkspace', 'session'];
export function AuthoringContainerDirective(authoringWorkspace: AuthoringWorkspaceService, session) {
    function AuthoringContainerController() {
        var self = this;

        this.state = {};
        this.showingSuggestions = false;

        /**
         * Start editing item using given action mode
         *
         * @param {string} item
         * @param {string} action
         */
        this.edit = function(item, action) {
            self.item = item;
            self.action = action;
            self.state.opened = !!item;
        };
    }

    return {
        controller: AuthoringContainerController,
        controllerAs: 'authoring',
        templateUrl: 'scripts/apps/authoring/views/authoring-container.html',
        scope: {},
        require: 'sdAuthoringContainer',
        link: function(scope, elem, attrs, ctrl) {
            let lastLockSession = 'not-set';
            const thisSessionId = session.sessionId;

            scope.loaded = true;

            scope.$watch(() => authoringWorkspace.getState()?.item?.lock_session, (currentLockSession) => {
                if (lastLockSession === thisSessionId && currentLockSession == null) {
                    // Re-mount authoring view when item is locked by someone else
                    // in order to clean up old UI elements

                    scope.loaded = false;

                    scope.$applyAsync(() => {
                        scope.loaded = true;
                    });
                }

                lastLockSession = currentLockSession;
            });

            scope.$watch(authoringWorkspace.getState, (state) => {
                if (state) {
                    ctrl.edit(null, null);
                    // do this in next digest cycle so that it can
                    // destroy authoring/packaging-embedded in current cycle
                    scope.$applyAsync(() => {
                        ctrl.edit(state.item, state.action);
                    });
                }
            });
        },
    };
}
