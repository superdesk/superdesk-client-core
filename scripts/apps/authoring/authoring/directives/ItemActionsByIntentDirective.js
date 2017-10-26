import _ from 'lodash';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdItemActionByIntent
 *
 * @requires superdesk
 * @requires activityService
 * @requires worflowService
 *
 * @description renders actions for item based on the intent.
 */
ItemActionsByIntentDirective.$inject = [
    'superdesk',
    'activityService',
    'workflowService'
];
export function ItemActionsByIntentDirective(superdesk, activityService, workflowService) {
    return {
        templateUrl: 'scripts/apps/authoring/views/item-actions-by-intent.html',
        link: function($scope, elem, attrs) {
            function getMenuGroups() {
                let intent = {};

                if (_.get(attrs, 'sdIntentType')) {
                    intent.type = _.get(attrs, 'sdIntentType');
                }

                if (_.get(attrs, 'sdIntentAction')) {
                    intent.action = _.get(attrs, 'sdIntentAction');
                }

                if (_.isEmpty(intent)) {
                    return [];
                }

                let groups = {};

                // find the activity based on the intent
                superdesk.findActivities(intent, $scope.item).forEach((activity) => {
                    if (workflowService.isActionAllowed($scope.item, activity.action)) {
                        let group = activity.group || 'default';

                        groups[group] = groups[group] || [];
                        groups[group].push(activity);
                    }
                });

                $scope.menuGroups = _.keys(groups).map((key) => ({_id: key, actions: groups[key]}));
            }

            getMenuGroups();

            $scope.run = function(activity) {
                return activityService.start(activity, {data: {item: $scope.item}});
            };

            $scope.$watch('item', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    getMenuGroups();
                }
            }, true);
        }
    };
}