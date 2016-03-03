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
                var darkBox = angular.element('<div></div>');
                var lightBox = angular.element('<div></div>');

                $(elem).css({
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

                        darkBox.css({
                            'background': 'rgba(0, 0, 0, 0.4)',
                            'width': img.width,
                            'height': img.height,
                            'position': 'absolute',
                            'top': 0,
                            'left': 0,
                            'z-index': 1100
                        });

                        elem.append(img);
                        elem.append(darkBox);
                        elem.append(lightBox);

                        updateLightBox();
                    };
                    img.src = scope.src;
                });

                scope.$watch('cropData', updateLightBox);

                function updateLightBox() {
                    if (img && scope.original && scope.cropData) {
                        var ratio = img.height / scope.original.height;
                        lightBox.css({
                            'background': 'rgba(255, 255, 255, 0.4)',
                            'position': 'absolute',
                            'top': scope.cropData.CropTop * ratio,
                            'left': scope.cropData.CropLeft * ratio,
                            'width': (scope.cropData.CropRight - scope.cropData.CropLeft) * ratio,
                            'height': (scope.cropData.CropBottom - scope.cropData.CropTop) * ratio,
                            'z-index': 1200
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
     .directive('sdImageCrop', ['gettext', '$interpolate', 'imageFactory', '$timeout', function(gettext, $interpolate, imageFactory, $timeout) {
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
                    if (!src || (scope.showMinSizeError && !validateConstraints(scope.original, scope.rendition))) {
                        return;
                    }

                    var cropSelect = parseCoordinates(scope.cropInit) || getDefaultCoordinates(scope.original, scope.rendition);

                    refreshImage(src, cropSelect);
                });

                scope.$watch('cropData', function() {
                    if (scope.cropData && scope.cropData.CropBottom) {
                        refreshImage(img.src, [
                            scope.cropData.CropLeft,
                            scope.cropData.CropTop,
                            scope.cropData.CropRight - scope.cropData.CropLeft,
                            scope.cropData.CropBottom - scope.cropData.CropTop
                        ]);
                    }
                }, true);

                scope.$on('poiUpdate', function(e, point) {
                    var center = {
                        x: point.x * scope.original.width,
                        y: point.y * scope.original.height
                    };
                    var width = scope.cropData.CropRight - scope.cropData.CropLeft;
                    var height = scope.cropData.CropBottom - scope.cropData.CropTop;
                    var crop = {
                        CropLeft: center.x - width / 2,
                        CropTop: center.y - height / 2,
                        CropRight: center.x + width / 2,
                        CropBottom: center.y + height / 2
                    };
                    /*
                    if (crop.CropLeft < 0) {
                        crop.CropRight = crop.CropRight - crop.CropLeft;
                        crop.CropLeft = 0;
                    } else if (crop.CropRight > scope.original.width) {
                        crop.CropLeft = crop.CropLeft - crop.CropRight - scope.original.width;
                        crop.CropRight = scope.original.width;
                    }
                    */

                    for (var i in crop) {
                        crop[i] = Math.round(crop[i]);
                    }
                    angular.extend(scope.cropData, crop);
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
                        angular.element(img).css({
                            // 'position': 'absolute',
                            // 'left': 0,
                            // 'top': 0
                        });
                        elem.append(img);
                    };
                    img.addEventListener('click', function(event) {
                        scope.point.x = Math.round(event.offsetX * 100 / img.width) / 100;
                        scope.point.y = Math.round(event.offsetY * 100 / img.height) / 100;
                        //console.log(scope.point);
                        scope.onChange();
                        scope.$apply();
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

                    drawPoint();
                }

                function drawPoint() {
                    pointElem.css({
                        left: (scope.point.x * img.width) - 20,
                        top: (scope.point.y * img.height) - 20
                    });                   
                    crossLeft.css({
                        width: (scope.point.x * img.width) - 20,
                        top: (scope.point.y * img.height)
                    });
                    crossRight.css({
                        width: ((1 - scope.point.x) * img.width) - 24,
                        top: (scope.point.y * img.height),
                        left: (scope.point.x * img.width) + 24
                    });
                    crossBottom.css({
                        height: ((1 - scope.point.y) * img.height) - 24,
                        top: (scope.point.y * img.height) + 24,
                        left: (scope.point.x * img.width) + 1
                    });
                    crossTop.css({
                        height: (scope.point.y * img.height) - 20,
                        left: (scope.point.x * img.width) + 1
                    });
                }
            }
        };
    }]);
})();
