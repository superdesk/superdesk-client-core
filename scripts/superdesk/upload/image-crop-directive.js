(function(_) {
    'use strict';

    return angular.module('superdesk.upload.imagecrop', [
        'superdesk.translate'
    ])

    /**
     * sd-image-crop based on Jcrop tool and provides Image crop functionality for
     * provided Aspect ratio and other attributes.
     * For Complete Usage of Jcrop:
     * refer to http://deepliquid.com/content/Jcrop_Manual.html
     *
     * Example Usage:
     * <div sd-image-crop
     *  data-src="data.renditions.viewImage.href"
     *  data-show-Min-Size-Error="true"
     *  data-crop-init="{}"
     *  data-box-width="800"
     *  data-box-height="600"
     *  data-rendition="{width: 800, height: 600}"
     *  data-crop-data="{CropLeft: 0, CropTop: 0, CropRight: 800, CropBottom: 600}">
     * </div>
     *
     * @data-cords attribute used to provide updated crop coordinates in preview.cords
     * scope.preview should be define on container page so that the coordiates can be used
     * to pass in api that is serving for saving the crop.
     */
     .directive('sdImageCrop', ['gettext', '$interpolate', 'imageFactory', function(gettext, $interpolate, imageFactory) {
        return {
            scope: {
                src: '=',
                cropInit: '=',
                cropData: '=',
                onChange: '&',
                original: '=',
                rendition: '=',
                boxWidth: '=',
                boxHeight: '=',
                showMinSizeError: '='
            },
            link: function(scope, elem) {
                var img;

                /**
                 * Updates crop coordinates scope
                 *
                 * @param {Array} cords
                 */
                function updateScope(cords) {
                    var nextData = formatCoordinates(cords);
                    var prevData = scope.cropData || scope.cropInit;
                    if (!angular.equals(nextData, prevData)) {
                        scope.cropData = nextData;
                        scope.onChange({cropData: nextData});
                    }
                }

                /**
                 * Format jCrop coordinates into superdesk crop specs
                 *
                 * @param {Object} cords jCrop coordinates
                 * @return {Object} superdesk crop specs
                 */
                function formatCoordinates(cords) {
                    return {
                        CropLeft: Math.round(Math.min(cords.x, cords.x2)),
                        CropRight: Math.round(Math.max(cords.x, cords.x2)),
                        CropTop: Math.round(Math.min(cords.y, cords.y2)),
                        CropBottom: Math.round(Math.max(cords.y, cords.y2))
                    };
                }

                /**
                 * Parse superdesk crop specs into jCrop coordinates
                 *
                 * @param {Object} cropImage
                 * @return {Array} [x0, y0, x1, y1]
                 */
                function parseCoordinates(cropImage) {
                    if (cropImage != null && cropImage.CropLeft != null) {
                        return [
                            cropImage.CropLeft,
                            cropImage.CropTop,
                            cropImage.CropRight,
                            cropImage.CropBottom
                        ];
                    }
                }

                scope.$watch('src', function(src) {
                    if (!src || (scope.showMinSizeError && !validateConstraints(scope.original, scope.rendition))) {
                        return;
                    }

                    var cropSelect = parseCoordinates(scope.cropInit) || getDefaultCoordinates(scope.original, scope.rendition);

                    refreshImage(src, cropSelect);
                });

                scope.$watch('cropData', function() {
                    if (scope.cropData) {
                        refreshImage(img.src, [
                            scope.cropData.CropLeft,
                            scope.cropData.CropTop,
                            scope.cropData.CropRight - scope.cropData.CropLeft,
                            scope.cropData.CropBottom - scope.cropData.Top
                        ]);
                    }
                });

                function refreshImage(src, setSelect) {
                    elem.empty();

                    img = imageFactory.makeInstance();
                    img.onload = function() {
                        elem.append(img);
                        $(img).Jcrop({
                            aspectRatio: scope.rendition.width ? scope.rendition.width / scope.rendition.height : null,
                            minSize: [scope.rendition.width, scope.rendition.height],
                            trueSize: [scope.original.width, scope.original.height],
                            boxWidth: scope.boxWidth,
                            boxHeight: scope.boxHeight,
                            setSelect: setSelect,
                            allowSelect: false,
                            addClass: 'jcrop-dark',
                            onSelect: updateScope
                        });
                    };

                    img.src = src;
                }

                function validateConstraints(img, rendition) {
                    if (img.width < rendition.width || img.height < rendition.height) {
                        scope.$apply(function() {
                            var text = $interpolate(
                                gettext('Sorry, but image must be at least {{ r.width }}x{{ r.height }},' +
                                        ' (it is {{ img.width }}x{{ img.height }}).')
                            )({
                                r: rendition,
                                img: img
                            });

                            elem.append('<p class="error">' + text);
                        });

                        return false;
                    }

                    return true;
                }

                /**
                 * Get the largest part of image matching required specs.
                 *
                 * @param {Object} img
                 * @param {Object} rendition
                 * @return {Array} [x0, y0, x1, y1]
                 */
                function getDefaultCoordinates(img, rendition) {
                    if (!rendition.width || !rendition.height) {
                        return [0, 0, img.width, img.height];
                    }

                    var ratio = Math.min(img.width / rendition.width, img.height / rendition.height);
                    var width = Math.floor(ratio * rendition.width);
                    var height = Math.floor(ratio * rendition.height);
                    var x0 = Math.floor((img.width - width) / 2);
                    var y0 = Math.floor((img.height - height) / 2);
                    return [x0, y0, x0 + width, y0 + height];
                }
            }
        };
    }])
    .directive('sdImagePoint', [function() {
        return {
            scope: {
                src: '=',
                point: '=',
                onChange: '&'
            },
            link: function(scope, elem) {
                var img;
                var pointElem;
                var crossLeftTop;
                var crossRightTop;
                var crossLeftBottom;
                var crossRightBottom;

                elem.css({'position': 'relative'});

                scope.$watch('src', function(src) {
                    refreshImage(src);
                });

                scope.$watch('point', function() {
                    if (img && pointElem) {
                        drawPoint();
                    }
                }, true);

                function refreshImage(src) {
                    elem.empty();

                    img = new Image();
                    img.onload = function() {
                        angular.element(img).css({
                            'position': 'absolute',
                            'left': 0,
                            'top': 0
                        });
                        elem.append(img);
                    };
                    img.addEventListener('click', function(event) {
                        scope.point.x = Math.round(event.offsetX * 100 / img.width) / 100;
                        scope.point.y = Math.round(event.offsetY * 100 / img.height) / 100;
                        scope.onChange();
                        scope.$apply();
                    });
                    img.src = src;

                    pointElem = angular.element('<div class="poi__cursor"></div>');
                    elem.append(pointElem);
                    pointElem.css({
                        'position': 'absolute',
                        'z-index': 10000
                    });
                    crossLeftTop = angular.element('<div class="poi__cross-left-top"></div>');
                    elem.append(crossLeftTop); 
                    crossLeftBottom = angular.element('<div class="poi__cross-left-bottom"></div>');
                    elem.append(crossLeftBottom); 
                    crossRightTop = angular.element('<div class="poi__cross-right-top"></div>');
                    elem.append(crossRightTop); 
                    crossRightBottom = angular.element('<div class="poi__cross-right-bottom"></div>');
                    elem.append(crossRightBottom);                    

                    drawPoint();
                }

                function drawPoint() {
                    pointElem.css({
                        left: (scope.point.x * img.width) - 20,
                        top: (scope.point.y * img.height) - 20
                    });
                    crossLeftTop.css({
                        width: (scope.point.x * img.width),
                        height: (scope.point.y * img.height) - 20
                    });
                    crossLeftBottom.css({
                        width: (scope.point.x * img.width) - 20,
                        height: ((1 - scope.point.y) * img.height),
                        top: (scope.point.y * img.height)
                    });
                    crossRightTop.css({
                        width: ((1 - scope.point.x) * img.width),
                        height: (scope.point.y * img.height),
                        left: (scope.point.x * img.width) + 22
                    });
                    crossRightBottom.css({
                        width: ((1 - scope.point.x) * img.width),
                        height: ((1 - scope.point.y) * img.height) - 22,
                        left: (scope.point.x * img.width),
                        top: (scope.point.y * img.height) + 22
                    });
                }
            }
        };
    }]);
})();
