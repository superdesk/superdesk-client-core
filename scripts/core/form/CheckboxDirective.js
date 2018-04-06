
export default function CheckboxDirective() {
    return {
        scope: {
            label: '@',
            model: '=',
        },
        template: require('./views/checkbox-directive.html')
    };
}