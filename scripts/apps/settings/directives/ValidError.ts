export function ValidError() {
    return {
        link: function(scope, element) {
            element.addClass('validation-error');
        },
    };
}
