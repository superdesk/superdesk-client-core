export function PreventPreview() {
    return {
        link: function(scope, el) {
            el.bind('click', previewOnClick);

            scope.$on('$destroy', () => {
                el.unbind('click', previewOnClick);
            });

            function previewOnClick(event) {
                if ($(event.target).closest('.group-select').length === 0) {
                    scope.$apply(() => {
                        scope.preview(scope.pitem);
                    });
                }
            }
        },
    };
}
