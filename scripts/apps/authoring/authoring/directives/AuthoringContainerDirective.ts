import {AuthoringWorkspaceService} from '../services/AuthoringWorkspaceService';
import {dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {IArticle} from 'superdesk-api';

let itemInEditMode: IArticle | null = null;

AuthoringContainerDirective.$inject = ['authoringWorkspace'];
export function AuthoringContainerDirective(authoringWorkspace: AuthoringWorkspaceService) {
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
                    if (itemInEditMode != null) {
                        dispatchCustomEvent('articleEditEnd', itemInEditMode);

                        itemInEditMode = null;
                    }

                    if (state.action === 'edit') {
                        itemInEditMode = state.item;

                        dispatchCustomEvent('articleEditStart', itemInEditMode);
                    }

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
