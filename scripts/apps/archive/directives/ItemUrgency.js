ItemUrgency.$inject = ['metadata'];

export function ItemUrgency(metadata) {
    metadata.initialize();
    return {
        scope: {urgency: '='},
        template: [
            '<span ng-if="urgency" class="urgency-label urgency-label--{{ urgency }}" ',
            'ng-style="{backgroundColor: color}" title="{{ \'Urgency\' | translate }}: {{ title }}">{{ short }}</span>',
        ].join(''),
        link: function(scope, elem) {
            scope.$watch('urgency', (urgency) => {
                if (urgency) {
                    var spec = metadata.urgencyByValue(urgency);

                    if (spec) {
                        scope.color = spec.color;
                        scope.short = spec.short || urgency;
                        scope.title = spec.name;
                    }
                }
            });
        },
    };
}
