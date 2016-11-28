ActivityMessage.$inject = ['gettextCatalog'];
export function ActivityMessage(gettextCatalog) {
    return {
        scope: {activity: '='},
        template: '{{display_message}}',
        link: function(scope, element, attrs) {
            if (scope.activity.name !== 'notify') {
                scope.display_message = gettextCatalog.getString(scope.activity.message);
                for (var tag in scope.activity.data) {
                    if (scope.activity.data.hasOwnProperty(tag)) {
                        var tagRegex = new RegExp('{{\\s*' + tag + '\\s*}}', 'gi');
                        scope.display_message =
                            scope.display_message.replace(tagRegex, scope.activity.data[tag]);
                    }
                }
            }
        }
    };
}
