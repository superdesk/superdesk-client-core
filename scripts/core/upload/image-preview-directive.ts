export const getDataUrl = (file: File) => new Promise<string>((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result.toString());
    fileReader.readAsDataURL(file);
});

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

            scope.$watch('file', (file) => {
                if (file && IS_IMG_REGEXP.test(file.type)) {
                    setProgress(30);
                    getDataUrl(file).then((dataUrl) => {
                        scope.$apply(() => {
                            scope.sdImagePreview = dataUrl;
                            setProgress(50);
                        });

                        var img = document.createElement('img');

                        img.onload = function() {
                            scope.$apply(() => {
                                scope.width = img.width;
                                scope.height = img.height;
                            });
                        };
                        img.src = dataUrl;
                    });
                }
            });

            scope.$on('$destroy', () => {
                window.URL.revokeObjectURL(scope.sdImagePreview);
            });
        },
    };
}]);
