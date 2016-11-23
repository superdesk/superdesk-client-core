export function FileUpload() {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            element.bind('change', function(event) {
                scope.$emit('fileSelected', {file: event.target.files[0]});
            });
        }
    };
}
