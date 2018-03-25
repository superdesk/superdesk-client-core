/**
 * @ngdoc directive
 * @module superdesk.apps.archive
 * @name sdAssignmentIcon
 *
 * @description Renders the assignment icon if the item is the output of an assignment.
 *
 */

export function AssignmentIcon() {
    return {
        templateUrl: 'scripts/apps/archive/views/assignment-icon.html',
        scope: {item: '='},
        link: function(scope, elem) {
            function handleAssignmentLink(event, data) {
                if (data.item !== scope.item._id) {
                    return;
                }

                if (event.name === 'content:link') {
                    scope.item.assignment_id = data.assignment;
                } else {
                    scope.item.assignment_id = null;
                }
            }

            scope.$on('content:link', handleAssignmentLink);
            scope.$on('content:unlink', handleAssignmentLink);
            scope.$on('assignments:removed', handleAssignmentLink);
        }
    };
}
