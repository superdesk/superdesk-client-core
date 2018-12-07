
export default function SelectDirective() {
    return {
        scope: {
            label: '@',
            model: '=',
            options: '=',
            optionLabel: '@',
            optionValue: '@',
            required: '=',
        },
        template: require('./views/select-directive.html'),
        link: (scope, element) => {
            scope.ngModel = element.find('select').controller('ngModel');
        },
    };
}
