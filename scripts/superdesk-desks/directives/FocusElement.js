export function FocusElement() {
    return {
        link: function(scope, elem, attrs) {
            elem.click(function() {
                _.defer(function() {
                    angular.element(document.querySelector(attrs.target)).focus();
                });
            });
        }
    };
}
