import _ from 'lodash';
import {gettext} from 'core/utils';

angular.module('superdesk.core.upload.crop', [])
    .directive('sdCrop', ['notify', function(notify) {
        return {
            scope: {
                src: '=',
                file: '=',
                cords: '=',
                progressWidth: '=',
                maxFileSize: '=',
            },
            link: function(scope, elem) {
                var bounds, boundx, boundy;

                var updateScope = _.throttle((c) => {
                    scope.$apply(() => {
                        scope.cords = c;
                        var rx = 120 / scope.cords.w;
                        var ry = 120 / scope.cords.h;

                        showPreview('.preview-target-1', rx, ry, boundx, boundy, scope.cords.x, scope.cords.y);
                        showPreview('.preview-target-2', rx / 2, ry / 2, boundx, boundy, scope.cords.x, scope.cords.y);
                    });
                }, 300);

                function showPreview(e, rx, ry, boundX, boundY, cordx, cordy) {
                    $(e).css({
                        width: Math.round(rx * boundX) + 'px',
                        height: Math.round(ry * boundY) + 'px',
                        marginLeft: '-' + Math.round(rx * cordx) + 'px',
                        marginTop: '-' + Math.round(ry * cordy) + 'px',
                    });
                }

                scope.$watch('src', (src) => {
                    elem.empty();
                    if (scope.file && scope.maxFileSize
                    && scope.file.size / 1048576 > parseInt(scope.maxFileSize, 10)) {
                        notify.info(gettext(
                            'Image is bigger than {{maxFileSize}}MB, upload file size may be limited!',
                            {maxFileSize: scope.maxFileSize},
                        ));
                    }

                    if (src) {
                        var img = new Image();

                        img.onload = function() {
                            scope.progressWidth = 80;
                            var size = [this['width'], this['height']];

                            if (size[0] < 200 || size[1] < 200) {
                                scope.$apply(() => {
                                    notify.pop();
                                    notify.error(gettext('Sorry, but avatar must be at least 200x200 pixels big.'));
                                    scope.src = null;
                                    scope.progressWidth = 0;
                                });

                                return;
                            }

                            elem.append(img);
                            $(img).Jcrop({
                                aspectRatio: 1.0,
                                minSize: [200, 200],
                                trueSize: size,
                                boxWidth: 300,
                                boxHeight: 225,
                                setSelect: [0, 0, Math.min.apply(size), Math.min.apply(size)],
                                allowSelect: false,
                                onChange: updateScope,
                            }, function() {
                                bounds = this.getBounds();
                                boundx = bounds[0];
                                boundy = bounds[1];
                            });
                            scope.progressWidth = 0;
                        };
                        img.src = src;
                    }
                });
            },
        };
    }]);
