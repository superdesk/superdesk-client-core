(function(_) {
    'use strict';

    return angular.module('superdesk.upload.imagecrop', [
        'superdesk.translate'
    ])

    .directive('sdImageCropView', [function() {
        return {
            scope: {
                src: '=',
                cropData: '=',
                original: '='
            },
            link: function(scope, elem) {
                var img;
                var cropBox = angular.element('<div class="crop-box"></div>');
                elem.css({
                    'position': 'relative'
                });
                scope.$watch('src', function() {
                    img = new Image();
                    img.onload = function() {
                        elem.empty();
                        $(img).css({
                            'position': 'absolute',
                            'top': 0,
                            'left': 0,
                            'z-index': 1000
                        });
                        elem.append(img);
                        elem.append(cropBox);
                        updateCropBox();
                    };
                    img.src = scope.src;
                });
                scope.$watch('cropData', updateCropBox);

                function updateCropBox() {
                    if (img && scope.original && scope.cropData) {
                        var ratio = img.height / scope.original.height;
                        var cTop = scope.cropData.CropTop * ratio;
                        var cLeft = scope.cropData.CropLeft * ratio;
                        var cBottom = img.height - scope.cropData.CropBottom * ratio;
                        var cRight = img.width - scope.cropData.CropRight * ratio;
                        cropBox.css({
                            'width': img.width,
                            'height': img.height,
                            'border-top-width': cTop + 'px',
                            'border-left-width': cLeft + 'px',
                            'border-bottom-width': cBottom + 'px',
                            'border-right-width': cRight + 'px'
                        });
                    }
                }
            }
        };
    }])

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
     .directive('sdImageCrop', ['gettext', '$interpolate', 'imageFactory', '$timeout', 'lodash',
     function(gettext, $interpolate, imageFactory, $timeout, _) {
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
                var img, cropData, jcropApi, selectionWidth, selectionHeight;

                /**
                 * Updates crop coordinates scope
                 *
                 * @param {Array} cords
                 */
                function updateScope(cords) {
                    var nextData = formatCoordinates(cords);
                    selectionWidth = nextData.CropRight - nextData.CropLeft;
                    selectionHeight = nextData.CropBottom - nextData.CropTop;
                    var prevData = cropData || scope.cropInit;
                    var cropsList = ['CropLeft', 'CropRight', 'CropTop', 'CropBottom'];
                    if (!angular.equals(_.pick(nextData, cropsList), _.pick(prevData, cropsList))) {
                        angular.extend(scope.cropData, nextData);
                        scope.onChange({renditionName: scope.rendition.name, cropData: nextData});
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
                    var cropSelect = parseCoordinates(scope.cropInit) || getDefaultCoordinates(scope.original, scope.rendition);
                    refreshImage(src, cropSelect);
                });

                scope.$watch('cropData', function() {
                    if (!cropData) {
                        cropData = scope.cropData;
                        if (cropData && cropData.CropBottom) {
                            refreshImage(img.src, [
                                cropData.CropLeft,
                                cropData.CropTop,
                                cropData.CropRight,
                                cropData.CropBottom
                            ]);
                        }
                    }
                });

                scope.$on('poiUpdate', function(e, point) {
                    var center = {
                        x: point.x * scope.original.width,
                        y: point.y * scope.original.height
                    };

                    if (center.x < selectionWidth / 2) {
                        center.x = selectionWidth / 2;
                    }
                    if (center.y < selectionHeight / 2) {
                        center.y = selectionHeight / 2;
                    }
                    if (center.x > scope.original.width - selectionWidth / 2) {
                        center.x = scope.original.width - selectionWidth / 2;
                    }
                    if (center.y > scope.original.height - selectionHeight / 2) {
                        center.y = scope.original.height - selectionHeight / 2;
                    }

                    var crop = {
                        CropLeft: Math.round(center.x - selectionWidth / 2),
                        CropTop: Math.round(center.y - selectionHeight / 2),
                        CropRight: Math.round(center.x + selectionWidth / 2),
                        CropBottom: Math.round(center.y + selectionHeight / 2)
                    };
                    angular.extend(cropData, crop);
                    refreshImage(img.src, [
                        cropData.CropLeft,
                        cropData.CropTop,
                        cropData.CropRight,
                        cropData.CropBottom
                    ]);
                });

                function refreshImage(src, setSelect) {
                    elem.empty();

                    img = imageFactory.makeInstance();
                    img.onload = function() {
                        if (!src || (scope.showMinSizeError && !validateConstraints(scope.original, scope.rendition))) {
                            return;
                        }
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
                        }, function() {
                            jcropApi = this;
                        });
                    };

                    img.src = src;
                }

                function validateConstraints(img, rendition) {
                    if (img.width < rendition.width || img.height < rendition.height) {
                        var text = $interpolate(
                            gettext('Sorry, but image must be at least {{ r.width }}x{{ r.height }},' +
                                    ' (it is {{ img.width }}x{{ img.height }}).')
                        )({
                            r: rendition,
                            img: img
                        });

                        elem.append('<p class="error">' + text);

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
    .directive('sdImagePoint', ['$rootScope', function($rootScope) {
        return {
            scope: {
                src: '=',
                point: '=',
                onChange: '&'
            },
            link: function(scope, elem) {
                var img;
                var pointElem;
                var crossLeft;
                var crossTop;
                var crossBottom;
                var crossRight;

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
                        elem.append(img);
                        drawPoint();
                    };
                    img.addEventListener('click', function(event) {
                        scope.$apply(function() {
                            elem.addClass('transition-on');
                            scope.point.x = Math.round(event.offsetX * 100 / img.width) / 100;
                            scope.point.y = Math.round(event.offsetY * 100 / img.height) / 100;
                            scope.onChange();
                        });
                        $rootScope.$broadcast('poiUpdate', scope.point);
                    });
                    img.src = src;

                    pointElem = angular.element('<div class="poi__cursor"></div>');
                    elem.append(pointElem);
                    pointElem.css({
                        'position': 'absolute',
                        'z-index': 10000
                    });

                    crossLeft = angular.element('<div class="poi__cross-left"></div>');
                    elem.append(crossLeft);
                    crossRight = angular.element('<div class="poi__cross-right"></div>');
                    elem.append(crossRight);
                    crossTop = angular.element('<div class="poi__cross-top"></div>');
                    elem.append(crossTop);
                    crossBottom = angular.element('<div class="poi__cross-bottom"></div>');
                    elem.append(crossBottom);

                }

                function drawPoint() {
                    pointElem.css({
                        left: (scope.point.x * img.width) - 15,
                        top: (scope.point.y * img.height) - 15
                    });
                    crossLeft.css({
                        width: (scope.point.x * img.width) - 15,
                        top: (scope.point.y * img.height)
                    });
                    crossRight.css({
                        width: ((1 - scope.point.x) * img.width) - 19,
                        top: (scope.point.y * img.height),
                        left: (scope.point.x * img.width) + 19
                    });
                    crossBottom.css({
                        height: ((1 - scope.point.y) * img.height) - 19,
                        top: (scope.point.y * img.height) + 19,
                        left: (scope.point.x * img.width) + 1
                    });
                    crossTop.css({
                        height: (scope.point.y * img.height) - 15,
                        left: (scope.point.x * img.width) + 1
                    });
                }
            }
        };
    }]);
})();
