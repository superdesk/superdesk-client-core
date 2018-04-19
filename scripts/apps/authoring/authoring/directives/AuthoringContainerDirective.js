AuthoringContainerDirective.$inject = ['authoring', 'authoringWorkspace'];
export function AuthoringContainerDirective(authoring, authoringWorkspace) {
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
