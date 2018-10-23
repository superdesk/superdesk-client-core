
export default function SwitchInvertedDirective() {
    return {
        scope: {
            id: '@',
            label: '@',
            model: '=',
        },
        template: require('./views/switch-inverted-directive.html'),
    };
}
