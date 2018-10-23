export function ValidErrorDirective() {
    return {
        link: function(scope, element) {
            element.addClass('validation-error');
        },
    };
}
