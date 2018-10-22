angular.module('superdesk.core.upload.imagepreview', []).directive('sdImagePreview', [function() {
    var IS_IMG_REGEXP = /^image\//;

    return {
        scope: {
            file: '=',
            sdImagePreview: '=',
            progressWidth: '=',
            width: '=?',
            height: '=?',
        },
        link: function(scope, elem) {
            function setProgress(val) {
                if (scope.progressWidth !== undefined) {
                    scope.progressWidth = val;
                }
            }

            function updatePreview(e) {
                scope.$apply(() => {
                    scope.sdImagePreview = e.target.result;
                    setProgress(50);
                });

                var img = document.createElement('img');

                img.onload = function() {
                    scope.$apply(() => {
                        scope.width = img.width;
                        scope.height = img.height;
                    });
                };
                img.src = e.target.result;
            }

            scope.$watch('file', (file) => {
                if (file && IS_IMG_REGEXP.test(file.type)) {
                    var fileReader = new FileReader();

                    fileReader.onload = updatePreview;
                    fileReader.readAsDataURL(file);
                    setProgress(30);
                }
            });

            scope.$on('$destroy', () => {
                window.URL.revokeObjectURL(scope.sdImagePreview);
            });
        },
    };
}]);
