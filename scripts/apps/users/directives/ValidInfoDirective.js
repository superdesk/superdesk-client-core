export function ValidInfoDirective() {
    return {
        link: function(scope, element) {
            element.addClass('validation-info');
        },
    };
}
