export function PreventPreview() {
    return {
        link: function(scope, el) {
            el.bind('click', previewOnClick);

            scope.$on('$destroy', function() {
                el.unbind('click', previewOnClick);
            });

            function previewOnClick(event) {
                if ($(event.target).closest('.group-select').length === 0) {
                    scope.$apply(function() {
                        scope.preview(scope.pitem);
                    });
                }
            }
        }
    };
}
