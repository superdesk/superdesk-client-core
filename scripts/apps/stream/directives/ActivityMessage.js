ActivityMessage.$inject = ['sdActivityMessage'];
export function ActivityMessage(sdActivityMessage) {
    return {
        scope: {activity: '='},
        template: '{{display_message}}',
        link: function(scope, element, attrs) {
            scope.display_message = sdActivityMessage.format(scope.activity);
        }
    };
}
