export default angular.module('superdesk.core.upload.imagecrop', [
    'superdesk.core.translate',
])

    .directive('sdImageCropView', [function() {
        return {
            scope: {
                src: '=',
                cropData: '=',
                original: '=',
            },
            template: '<img ng-src="{{ src }}"/><div class="crop-box"></div>',
            link: function(scope, elem) {
                var img;
                var $cropBox = elem.find('.crop-box');
                var $img = elem.find('img');

                elem.css({
                    position: 'relative',
                });
                scope.$watch('src', () => {
                    img = new Image();
                    img.onload = function() {
                        $img.css({
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            'z-index': 1000,
                        });
                        updateCropBox();
                    };
                    img.src = scope.src;
                });
                scope.$watch('cropData', updateCropBox);

                function updateCropBox() {
                    if ($img && scope.original && scope.cropData) {
                        var ratio = $img.height() / scope.original.height;
                        var cTop = scope.cropData.CropTop * ratio;
                        var cLeft = scope.cropData.CropLeft * ratio;
                        var cBottom = $img.height() - scope.cropData.CropBottom * ratio;
                        var cRight = $img.width() - scope.cropData.CropRight * ratio;

                        $cropBox.css({
                            width: $img.width(),
                            height: $img.height(),
                            'border-top-width': cTop + 'px',
                            'border-left-width': cLeft + 'px',
                            'border-bottom-width': cBottom + 'px',
                            'border-right-width': cRight + 'px',
                        });
                    }
                }
            },
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
 *  data-rendition="{width: 800, height: 600, name: '4-3'}"
 *  data-crop-data="{CropLeft: 0, CropTop: 0, CropRight: 800, CropBottom: 600}">
 * </div>
 */
    .directive('sdImageCrop', ['gettext', '$interpolate', 'imageFactory', 'lodash',
        function(gettext, $interpolate, imageFactory, _) {
            return {
                scope: {
                    src: '=',
                    cropInit: '=',
                    cropData: '=',
                    onChange: '&',
                    original: '=',
                    rendition: '=',
                    showMinSizeError: '=',
                },
                link: function(scope, elem) {
                    var img, cropData, selectionWidth, selectionHeight, jcropApi;

                    /**
                * Test if crop data a equals to crop data b
                *
                * @param {Object} a
                * @param {Object} b
                * @return {Boolean}
                */
                    function isEqualCrop(a, b) {
                        return a && b &&
                     a.CropLeft === b.CropLeft &&
                     a.CropRight === b.CropRight &&
                     a.CropTop === b.CropTop &&
                     a.CropBottom === b.CropBottom;
                    }

                    /**
                  * Updates crop coordinates scope
                  *
                  * @param {Array} cords
                  */
                    function updateScope(cords) {
                        var nextData = formatCoordinates(cords);

                        selectionWidth = nextData.CropRight - nextData.CropLeft;
                        selectionHeight = nextData.CropBottom - nextData.CropTop;

                        if (!isEqualCrop(nextData, scope.cropData)) {
                            angular.extend(scope.cropData, nextData);
                            scope.onChange({
                                renditionName: scope.rendition && scope.rendition.name || undefined,
                                cropData: nextData,
                            });
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
                            CropBottom: Math.round(Math.max(cords.y, cords.y2)),
                        };
                    }

                    /**
                  * Parse superdesk crop specs into jCrop coordinates
                  *
                  * @param {Object} cropImage
                  * @return {Array} [x0, y0, x1, y1]
                  */
                    function parseCoordinates(cropImage) {
                        if (!_.isNil(cropImage) && !_.isNil(cropImage.CropLeft)) {
                            return [
                                cropImage.CropLeft,
                                cropImage.CropTop,
                                cropImage.CropRight,
                                cropImage.CropBottom,
                            ];
                        }
                    }

                    scope.$watch('src', (src) => {
                        var cropSelect = parseCoordinates(scope.cropInit) ||
                        getDefaultCoordinates(scope.original, scope.rendition || {});

                        refreshImage(src, cropSelect);
                    });

                    scope.$watch('rendition.name', () => {
                        cropData = scope.cropData || {};
                        if (cropData && cropData.CropBottom) {
                            refreshImage(img.src, [
                                cropData.CropLeft,
                                cropData.CropTop,
                                cropData.CropRight,
                                cropData.CropBottom,
                            ]);
                        }
                    }, true);

                    scope.$watch('cropData', (newVal, oldVal) => {
                        if (newVal === oldVal) {
                            return;
                        }
                        cropData = scope.cropData || {};
                        if (cropData && cropData.CropBottom) {
                            if (!isEqualCrop(newVal, oldVal)) {
                                refreshImage(img.src, [
                                    cropData.CropLeft,
                                    cropData.CropTop,
                                    cropData.CropRight,
                                    cropData.CropBottom,
                                ]);
                            }
                        }
                    }, true);

                    scope.$on('poiUpdate', (e, point) => {
                        if (!jcropApi || !jcropApi.tellSelect()) {
                            return;
                        }

                        angular.element('.crop-area.thumbnails').css({
                            height: angular.element('.crop-area.thumbnails').height(),
                        });

                        var center = {
                            x: point.x * scope.original.width,
                            y: point.y * scope.original.height,
                        };

                        // query current crop selection values
                        var selectionData = jcropApi.tellSelect();

                        selectionWidth = Math.round(selectionData.w);
                        selectionHeight = Math.round(selectionData.h);

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
                            CropBottom: Math.round(center.y + selectionHeight / 2),
                        };

                        angular.extend(cropData, crop);
                        scope.$applyAsync(() => {
                            refreshImage(img.src, [
                                cropData.CropLeft,
                                cropData.CropTop,
                                cropData.CropRight,
                                cropData.CropBottom,
                            ]);
                        });
                    });

                    function refreshImage(src, setSelect) {
                        img = imageFactory.makeInstance();
                        img.onload = function() {
                            if (!src || scope.showMinSizeError
                            && !validateConstraints(scope.original, scope.rendition)) {
                                return;
                            }

                            if (jcropApi) {
                                jcropApi.destroy();
                            }
                            elem.empty();
                            elem.append(img);
                            var ratio, minSize;

                            if (angular.isDefined(scope.rendition)) {
                                if (angular.isDefined(scope.rendition.ratio)) {
                                    ratio = scope.rendition.ratio.split(':');
                                    ratio = parseInt(ratio[0], 10) / parseInt(ratio[1], 10);
                                } else if (angular.isDefined(scope.rendition.width)
                                && angular.isDefined(scope.rendition.height)) {
                                    ratio = scope.rendition.width / scope.rendition.height;
                                } else {
                                    ratio = scope.original.width / scope.original.height;
                                }
                                minSize = [scope.rendition.width, scope.rendition.height];
                            }
                            $(img).Jcrop({
                                aspectRatio: ratio,
                                minSize: minSize,
                                trueSize: [scope.original.width, scope.original.height],
                                setSelect: setSelect,
                                allowSelect: false,
                                addClass: 'jcrop-dark',
                            }, function() {
                                var self = this;

                                // Store the Jcrop API in the jcropApi variable
                                jcropApi = self;
                                // define onSelect once Jcrop initialized
                                jcropApi.setOptions({
                                    onSelect: updateScope,
                                });

                                // Make initial crops selection available for new image.
                                if (_.isEmpty(scope.cropData)) {
                                    updateScope(jcropApi.tellSelect());
                                }
                            });
                        };

                        img.src = src;
                    }

                    function validateConstraints(_img, rendition) {
                        if (!angular.isDefined(rendition)) {
                            return true;
                        }
                        if (_img.width < rendition.width || _img.height < rendition.height) {
                            var text = $interpolate(
                                gettext('Sorry, but image must be at least {{ r.width }}x{{ r.height }},' +
                                ' (it is {{ img.width }}x{{ img.height }}).'),
                            )({
                                r: rendition,
                                img: _img,
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
                    function getDefaultCoordinates(_img, rendition) {
                        if (!rendition.width || !rendition.height) {
                            return [0, 0, _img.width, _img.height];
                        }

                        var ratio = Math.min(_img.width / rendition.width, _img.height / rendition.height);
                        var width = Math.floor(ratio * rendition.width);
                        var height = Math.floor(ratio * rendition.height);
                        var x0 = Math.floor((_img.width - width) / 2);
                        var y0 = Math.floor((_img.height - height) / 2);

                        return [x0, y0, x0 + width, y0 + height];
                    }

                    scope.$on('$destroy', () => {
                        if (jcropApi) {
                            jcropApi.destroy();
                        }
                    });
                },
            };
        }])
    .directive('imageonload', () => ({
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('load', () => {
            // call the function that was passed
                scope.$apply(attrs.imageonload);
            });
        },
    }))
    .directive('sdImagePoint', ['$window', 'lodash', function($window, _) {
        return {
            scope: {
                src: '=',
                poi: '=',
                onChange: '&',
            },
            templateUrl: 'scripts/apps/authoring/views/image-point.html',
            bindToController: true,
            controllerAs: 'vm',
            controller: ['$rootScope', function($rootScope) {
                var self = this;

                angular.extend(self, {
                    updatePOI: function(poi) {
                        if (!_.isEqual(self.poi, poi)) {
                            angular.extend(self.poi, poi);
                            self.onChange();
                            $rootScope.$broadcast('poiUpdate', self.poi);
                        }
                    },
                });
            }],
            link: function(scope, element, attrs, vm) {
            // init directive element style
                element.css({
                    position: 'relative',
                    display: 'block',
                });
                var circleRadius = 30 / 2;
                var lineThickness = 2;
                var $poiContainer = element.find('.image-point__poi');
                var $poiCursor = element.find('.image-point__poi__cursor');
                var $poiLeft = element.find('.image-point__poi__cross-left');
                var $poiRight = element.find('.image-point__poi__cross-right');
                var $poiTop = element.find('.image-point__poi__cross-top');
                var $poiBottom = element.find('.image-point__poi__cross-bottom');

                function drawPoint(img, poi = vm.poi) {
                    var topOffset = poi.y * img.height - circleRadius;
                    var leftOffset = poi.x * img.width - circleRadius;
                    var verticalLeftOffset = leftOffset + circleRadius - lineThickness / 2;
                    var horizontalTopffset = topOffset + circleRadius - lineThickness / 2;

                    $poiContainer.css({
                        width: img.width,
                        height: img.height,
                    });
                    $poiCursor.css({
                        left: leftOffset,
                        top: topOffset,
                    });
                    $poiLeft.css({
                        width: leftOffset,
                        top: horizontalTopffset,
                    });
                    $poiRight.css({
                        width: img.width - (leftOffset + 2 * circleRadius),
                        top: horizontalTopffset,
                        left: leftOffset + 2 * circleRadius,
                    });
                    $poiTop.css({
                        height: topOffset,
                        left: verticalLeftOffset,
                    });
                    $poiBottom.css({
                        height: img.height - (topOffset + 2 * circleRadius),
                        left: verticalLeftOffset,
                        top: topOffset + 2 * circleRadius,
                    });
                }
                function updateWhenImageIsReady() {
                    var $img = element.find('.image-point__image').get(0);

                    function drawPointsFromModel() {
                        drawPoint($img);
                    }
                    // draws points
                    drawPointsFromModel();
                    // setup overlay to listen mouse events
                    (function onMouseEvents(_$img) {
                        var debouncedPoiUpdateModel = _.debounce((newPoi) => {
                            vm.updatePOI(newPoi);
                        }, 500);

                        function updatePOIModel(e) {
                            var newPoi = {
                                x: Math.round(e.offsetX * 100 / _$img.width) / 100,
                                y: Math.round(e.offsetY * 100 / _$img.height) / 100,
                            };

                            // refresh the points
                            drawPoint(_$img, newPoi);

                            // and notice the controller that points have been moved
                            debouncedPoiUpdateModel(newPoi);
                        }
                        // binds overlay events
                        var overlay = element.find('.image-point__poi__overlay');

                        var mousedown = false;
                        /** enable drag mode */

                        function enableDragMode(e) {
                            mousedown = true;
                            updatePOIModel(e);
                        }
                        /** exit Drag Mode */
                        function exitDragMode(e) {
                            updateOnMouseDrag(e);
                            mousedown = false;
                        }
                        /** update Poi if mouse is clicked */
                        function updateOnMouseDrag(e) {
                            if (mousedown) {
                                updatePOIModel(e);
                            }
                        }
                        var onExistEvents = ['mouseleave', 'mouseup'];

                        overlay.off('mousedown').on('mousedown', enableDragMode);
                        overlay.off('mousemove').on('mousemove', updateOnMouseDrag);
                        onExistEvents.forEach((eventName) => {
                            overlay.off(eventName).on(eventName, exitDragMode);
                        });
                        scope.$on('$destroy', () => {
                            overlay.off('mousedown', enableDragMode);
                            overlay.off('mousemove', updateOnMouseDrag);
                            onExistEvents.forEach((eventName) => {
                                overlay.off(eventName, exitDragMode);
                            });
                        });
                    })($img);
                }
                // initialize points
                scope.onImageLoad = updateWhenImageIsReady;
                // draw when needed
                scope.$on('poiUpdate', updateWhenImageIsReady);
                angular.element($window).on('resize', updateWhenImageIsReady);
                // on destroy
                scope.$on('$destroy', () => {
                    angular.element($window).off('resize', updateWhenImageIsReady);
                });
            },
        };
    }]);
