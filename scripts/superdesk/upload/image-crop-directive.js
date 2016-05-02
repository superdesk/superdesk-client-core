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
            template: '<img ng-src="{{ src }}"/><div class="crop-box"></div>',
            link: function(scope, elem) {
                var img;
                var $cropBox = elem.find('.crop-box');
                var $img = elem.find('img');
                elem.css({
                    'position': 'relative'
                });
                scope.$watch('src', function() {
                    img = new Image();
                    img.onload = function() {
                        $img.css({
                            'position': 'absolute',
                            'top': 0,
                            'left': 0,
                            'z-index': 1000
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
                            'width': $img.width(),
                            'height': $img.height(),
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
                    cropData = scope.cropData;
                    if (cropData && cropData.CropBottom) {
                        refreshImage(img.src, [
                            cropData.CropLeft,
                            cropData.CropTop,
                            cropData.CropRight,
                            cropData.CropBottom
                        ]);
                    }
                }, true);

                scope.$on('poiUpdate', function(e, point) {

                    angular.element('.crop-area.thumbnails').css({
                        'height': angular.element('.crop-area.thumbnails').height()
                    });

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
                        var ratio;
                        if (angular.isDefined(scope.rendition.ratio)) {
                            ratio = scope.rendition.ratio.split(':');
                            ratio = parseInt(ratio[0]) / parseInt(ratio[1]);
                        } else if (angular.isDefined(scope.rendition.width) && angular.isDefined(scope.rendition.height)) {
                            ratio = scope.rendition.width / scope.rendition.height;
                        } else {
                            ratio = scope.original.width / scope.original.height;
                        }
                        $(img).Jcrop({
                            aspectRatio: ratio,
                            minSize: [scope.rendition.width, scope.rendition.height],
                            trueSize: [scope.original.width, scope.original.height],
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
    .directive('sdImagePoint', ['$window', 'lodash', function($window, _) {
        return {
            scope: {
                src: '=',
                poi: '=',
                onChange: '&'
            },
            templateUrl: 'scripts/superdesk-authoring/views/image-point.html',
            bindToController: true,
            controllerAs: 'vm',
            controller: ['$rootScope', function($rootScope) {
                var vm = this;
                angular.extend(vm, {
                    updatePOI: function(poi) {
                        angular.extend(vm.poi, poi);
                        vm.onChange();
                        $rootScope.$broadcast('poiUpdate', vm.poi);
                    }
                });
            }],
            link: function(scope, element, attrs, vm) {
                var circleRadius = 30 / 2;
                var lineThickness = 2;
                var $poiContainer = element.find('.image-point__poi');
                var $poiCursor = element.find('.image-point__poi__cursor');
                var $poiLeft = element.find('.image-point__poi__cross-left');
                var $poiRight = element.find('.image-point__poi__cross-right');
                var $poiTop = element.find('.image-point__poi__cross-top');
                var $poiBottom = element.find('.image-point__poi__cross-bottom');
                function drawPoint(img, poi) {
                    if (!angular.isDefined(poi)) {
                        poi = vm.poi;
                    }
                    var topOffset = (poi.y * img.height) - circleRadius;
                    var leftOffset = (poi.x * img.width) - circleRadius;
                    var verticalLeftOffset = leftOffset + circleRadius - (lineThickness / 2);
                    var horizontalTopffset = topOffset + circleRadius - (lineThickness / 2);
                    $poiContainer.css({
                        width: img.width,
                        height: img.height
                    });
                    $poiCursor.css({
                        left: leftOffset,
                        top: topOffset
                    });
                    $poiLeft.css({
                        width: leftOffset,
                        top: horizontalTopffset
                    });
                    $poiRight.css({
                        width: img.width - (leftOffset + (2 * circleRadius)),
                        top: horizontalTopffset,
                        left: leftOffset +  (2 * circleRadius)
                    });
                    $poiTop.css({
                        height: topOffset,
                        left: verticalLeftOffset
                    });
                    $poiBottom.css({
                        height: img.height - (topOffset + (2 * circleRadius)),
                        left: verticalLeftOffset,
                        top: topOffset + (2 * circleRadius)
                    });
                }
                // init directive element style
                element.css({
                    position: 'relative',
                    display: 'block'
                });
                // load the image in order to know the size
                var img = new Image();
                img.onload = function() {
                    function drawPointsFromModel() {
                        drawPoint($img);
                    }
                    var $img = element.find('.image-point__image').get(0);
                    // initialize points
                    drawPointsFromModel();
                    // draw when needed
                    scope.$on('poiUpdate', drawPointsFromModel);
                    angular.element($window).on('resize', drawPointsFromModel);
                    // setup overlay to listen mouse events
                    (function($img) {
                        function updatePOIModel(e) {
                            var newPoi = {
                                x: Math.round(e.offsetX * 100 / $img.width) / 100,
                                y: Math.round(e.offsetY * 100 / $img.height) / 100
                            };
                            // refresh the points
                            drawPoint($img, newPoi);
                            // and notice the controller that points have been moved
                            debouncedPoiUpdateModel(newPoi);
                        }
                        var debouncedPoiUpdateModel = _.debounce(function(newPoi) {
                            vm.updatePOI(newPoi);
                        }, 500);
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
                        overlay.on('mousedown', enableDragMode);
                        overlay.on('mousemove', updateOnMouseDrag);
                        onExistEvents.forEach(function(eventName) {
                            overlay.on(eventName, exitDragMode);
                        });
                        scope.$on('$destroy', function () {
                            overlay.off('mousedown', enableDragMode);
                            overlay.off('mousemove', updateOnMouseDrag);
                            onExistEvents.forEach(function(eventName) {
                                overlay.off(eventName, exitDragMode);
                            });
                            angular.element($window).off('resize', drawPointsFromModel);
                        });
                    })($img);
                };
                img.src = scope.vm.src;
                // Break the circular link. The handler doesn’t reference DOM element any more.
                img = null;
            }
        };
    }]);
})();
