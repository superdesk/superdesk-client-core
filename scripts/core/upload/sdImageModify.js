export default angular.module('superdesk.core.upload.imagemodify', [
    'superdesk.core.translate',
])
    .directive('sdImageModify', () => ({
        scope: {
            src: '=',
            original: '=',
            brightness: '=',
            contrast: '=',
            saturate: '=',
            rotate: '=',
            fliph: '=',
            flipv: '=',
        },
        template: '<canvas id="image"></canvas>',
        link: function(scope) {
            let canvas = document.getElementById('image'),
                context = canvas.getContext('2d'),
                baseImage = new Image(),
                filter = {
                    brightness: scope.brightness ? 'brightness(' + scope.brightness + ') ' : '',
                    contrast: scope.contrast ? 'contrast(' + scope.contrast + ') ' : '',
                    saturate: scope.saturate ? 'saturate(' + scope.saturate + ') ' : '',
                },
                transform = {
                    rotate: scope.rotate ? 'rotateZ(' + scope.rotate + 'deg) ' : '',
                    flipH: scope.flipH ? 'rotateY(' + scope.fliph + 'deg) ' : '',
                    flipV: scope.flipV ? 'rotateX(' + scope.flipv + 'deg) ' : '',
                };

            baseImage.onload = function() {
                canvas.width = baseImage.width;
                canvas.height = baseImage.height;

                context.filter = filter.brightness + filter.contrast + filter.saturate;
                context.drawImage(baseImage, 0, 0);
            };

            scope.$watch('brightness', (value, old) => {
                filter.brightness = 'brightness(' + value + ') ';
                context.filter = filter.brightness + filter.contrast + filter.saturate;
                context.drawImage(baseImage, 0, 0);
            });

            scope.$watch('contrast', (value, old) => {
                filter.contrast = 'contrast(' + value + ') ';
                context.filter = filter.brightness + filter.contrast + filter.saturate;
                context.drawImage(baseImage, 0, 0);
            });

            scope.$watch('saturate', (value, old) => {
                filter.saturate = 'saturate(' + value + ') ';
                context.filter = filter.brightness + filter.contrast + filter.saturate;
                context.drawImage(baseImage, 0, 0);
            });

            scope.$watch('rotate', (value, old) => {
                transform.rotate = 'rotateZ(' + value + 'deg) ';
                setTransform();
            });

            scope.$watch('fliph', (value, old) => {
                transform.flipH = 'rotateY(' + value + 'deg) ';
                setTransform();
            });

            scope.$watch('flipv', (value, old) => {
                transform.flipV = 'rotateX(' + value + 'deg) ';
                setTransform();
            });

            scope.$watch('src', (value, old) => {
                baseImage.src = scope.src;
            });

            function setTransform() {
                canvas.setAttribute('style',
                    'transform:' + transform.rotate + transform.flipH + transform.flipV +
                    '; -webkit-transform:' + transform.rotate + transform.flipH + transform.flipV +
                    '; -moz-transform:' + transform.rotate + transform.flipH + transform.flipV);
            }
        },
    }));