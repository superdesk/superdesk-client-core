
export default function InputDirective() {
    return {
        scope: {
            id: '@',
            type: '@',
            label: '@',
            placeholder: '@',
            model: '=',
            required: '=',
        },
        template: require('./views/input-directive.html'),
        link: (scope, element) => {
            scope.ngModel = element.find('input').controller('ngModel');
        },
    };
}