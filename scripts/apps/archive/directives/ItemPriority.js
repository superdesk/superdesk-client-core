ItemPriority.$inject = ['metadata', 'gettext'];

export function ItemPriority(metadata, gettext) {
    metadata.initialize();
    return {
        scope: {priority: '='},
        template: [
            '<span ng-if="priority" class="priority-label priority-label--{{ priority }}" ',
            'ng-style="{backgroundColor: color}" title="{{ title }}">{{ short }}</span>'
        ].join(''),
        link: function(scope, elem) {
            scope.$watch('priority', function(priority) {
                if (priority) {
                    var spec = metadata.priorityByValue(priority);

                    if (spec) {
                        scope.color = spec.color;
                        scope.short = spec.short || priority;
                        scope.title = spec.name || gettext('Priority');
                    }
                }
            });
        }
    };
}
