export function FocusElement() {
    return {
        link: function(scope, elem, attrs) {
            elem.click(() => {
                _.defer(() => {
                    angular.element(document.querySelector(attrs.target)).focus();
                });
            });
        },
    };
}
