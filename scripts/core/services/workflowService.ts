import _ from 'lodash';

export default angular.module('superdesk.core.workflow', [])
    .run(['workflowService', angular.noop]) // make sure it's loaded
    .service('workflowService', ['preferencesService', '$rootScope', function(preferencesService, $rootScope) {
        var _actions = [];

        this.isActionAllowed = function isActionAllowed(item, actionName) {
            if (_.isUndefined(actionName) || _.isUndefined(item.state)) {
                return true;
            }

            var action = _.find(_actions, (actionItem) => actionItem.name === actionName);

            if (action) {
                if (!_.isEmpty(action.include_states)) {
                    return _.findIndex(action.include_states, (state) => item.state === state) >= 0;
                } else if (!_.isEmpty(action.exclude_states)) {
                    return _.findIndex(action.exclude_states, (state) => item.state === state) === -1;
                }
            }

            return false;
        };

        this.setActions = function(actions) {
            _actions = actions;
        };

        preferencesService.getActions().then(this.setActions);

        $rootScope.isActionAllowed = angular.bind(this, this.isActionAllowed);
    }]);
