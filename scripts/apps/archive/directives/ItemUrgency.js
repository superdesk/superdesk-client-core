ItemUrgency.$inject = ['metadata', 'gettext'];

export function ItemUrgency(metadata, gettext) {
    metadata.initialize();
    return {
        scope: {urgency: '='},
        template: [
            '<span ng-if="urgency" class="urgency-label urgency-label--{{ urgency }}" ',
            'ng-style="{backgroundColor: color}" title="{{ title }}">{{ short }}</span>'
        ].join(''),
        link: function(scope, elem) {
            scope.$watch('urgency', (urgency) => {
                if (urgency) {
                    var spec = metadata.urgencyByValue(urgency);

                    if (spec) {
                        scope.color = spec.color;
                        scope.short = spec.short || urgency;
                        scope.title = spec.name || gettext('Urgency');
                    }
                }
            });
        }
    };
}
