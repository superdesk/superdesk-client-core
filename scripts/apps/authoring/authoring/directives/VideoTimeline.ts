/* global _ */

import {
    TweenMax
} from "gsap/TweenMax";
import {
    isEmpty
} from 'lodash';
import ResizeObserver from 'resize-observer-polyfill';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdVideoTimeline
 *
 * @requires $timeout
 */
VideoTimeline.$inject = ['$rootScope', '$interval', 'api'];
export function VideoTimeline($rootScope, $interval, api) {
    return {
        scope: {
            video: '=',
            iconPlay: '=',
            iconStop: '=',
            cut: '=',
            listFrames: '=',
            onChange: '&',
            onSizeChange: '&',
            reloadThumbnails: '&',
        },
        templateUrl: 'scripts/apps/authoring/views/video-timeline.html',
        link: function (scope, element) {
            var mins = 0;
            var secs = 0;
            var li = 0;
            var progressoutput = element.find('.progress-output')[0];
            var inner = element.find('#inner-play')[0];
            var barleft = element.find('.control-bar.cb-left')[0];
            var barright = element.find('.control-bar.cb-right')[0];
            var controlbar = element.find('.control-bars')[0];
            var cbwrapper = element.find('.control-bars-wrapper')[0];
            var maskleft = element.find('.mask.left')[0];
            var maskright = element.find('.mask.right')[0];
            var inner_frames = element.find('#inner-frames')[0];
            let change_width = 0;
            let IntervalID;

            scope.reloadFrames = function () {   
                            
                stopInterval(IntervalID);
                inner_frames.innerHTML = '';
                if (!isNaN(scope.video.duration))
                {
                    loadTimeLine(scope.listFrames);
                }
            }            
            scope.reloadThumbnails({ reload: scope.reloadFrames });
            var observer = new ResizeObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (Math.abs(change_width - entry.contentRect.width) > 10 && !isNaN(scope.video.duration)) {
                        if (scope.listFrames == null) {
                            scope.onSizeChange();
                        }
                        else {
                            scope.reloadFrames();
                        }
                        change_width = entry.contentRect.width;

                    }
                });
            });
            observer.observe(controlbar);
            scope.$watch('listFrames', function (listFrames) {
                scope.reloadFrames(listFrames)
            });

            scope.$watch('video', (video) => {
                if (!video)
                    return;
                video.onplay = function () {
                    TweenMax.ticker.addEventListener('tick', vidUpdate);
                };
                video.onpause = function () {
                    TweenMax.ticker.removeEventListener('tick', vidUpdate);
                };
                video.onended = function () {
                    TweenMax.ticker.removeEventListener('tick', vidUpdate);
                };
            });

            scope.$watch('cut', (cut) => {
                if (isEmpty(cut)) {
                    return;
                }
                var position = cut.start / scope.video.duration;
                TweenMax.set(cbwrapper, {
                    left: (position * 100) + '%'
                });
                TweenMax.set(maskleft, {
                    width: (position * 100) + '%'
                });
                barleft.setAttribute("data-content", getstrtime(cut.start));
                var position = cut.end / scope.video.duration;
                TweenMax.set(cbwrapper, {
                    right: ((1 - position) * 100) + '%'
                });
                TweenMax.set(maskright, {
                    width: ((1 - position) * 100) + '%'
                });
                barright.setAttribute("data-content", getstrtime(cut.end));
            });

            function vidUpdate() {
                TweenMax.set(progressoutput, {
                    left: (scope.video.currentTime / scope.video.duration * 100) + "%"
                });
                inner.innerHTML = getstrtime(scope.video.currentTime);
                if (scope.video.currentTime > scope.cut.end) {
                    scope.video.pause();
                }
            };
            barleft.ondragstart = function () {
                onDragStart();
            };
            barleft.ondrag = function () {
                onDragCb("left");
            };
            barleft.ondragend = function () {
                onDragEndCb();
            };
            barright.ondragstart = function () {
                onDragStart()
            };
            barright.ondrag = function () {
                onDragCb("right");
            };
            barright.ondragend = function () {
                onDragEndCb();
            };
            var PositionX = 0;
            ondragover = function () {
                PositionX = event.clientX;
            }

            scope.controlBarClick = function () {
                var position = setTimeline();
                if (position * scope.video.duration < scope.cut.start) {
                    TweenMax.set(cbwrapper, {
                        left: (position * 100) + '%'
                    });
                    TweenMax.set(maskleft, {
                        width: (position * 100) + '%'
                    });
                }
                if (position * scope.video.duration > scope.cut.end) {
                    TweenMax.set(cbwrapper, {
                        right: ((1 - position) * 100) + '%'
                    });
                    TweenMax.set(maskright, {
                        width: ((1 - position) * 100) + '%'
                    });
                }
            };

            function getPositionBar(pX) {
                var position = ((pX - controlbar.getBoundingClientRect().left) / controlbar.offsetWidth);
                if (position > 1) {
                    position = 1;
                }
                if (position < 0) {
                    position = 0;
                }
                position = Math.floor(position * 100) / 100;
                return position;
            };

            function getstrtime(s) {
                mins = Math.floor(s / 60);
                mins = mins < 10 ? '0' + mins : mins;
                secs = Math.floor(s % 60);
                secs = secs < 10 ? '0' + secs : secs;
                li = Math.floor((s * 10) % 10);
                return mins + ':' + secs + '.' + li;
            };

            function onDragCb(type) {
                var position = getPositionBar(PositionX);
                if (type == 'right') {
                    TweenMax.set(cbwrapper, {
                        right: ((1 - position) * 100) + '%'
                    });
                    TweenMax.set(maskright, {
                        width: ((1 - position) * 100) + '%'
                    });
                    barright.setAttribute("data-content", getstrtime(position * scope.video.duration));
                    scope.cut.end = position * scope.video.duration;
                } else {
                    TweenMax.set(cbwrapper, {
                        left: (position * 100) + '%'
                    });
                    TweenMax.set(maskleft, {
                        width: (position * 100) + '%'
                    });
                    barleft.setAttribute("data-content", getstrtime(position * scope.video.duration));
                    scope.cut.start = position * scope.video.duration;
                }
            };


            function onDragEndCb() {
                setTimeline();
                scope.onChange();
            };

            function onDragStart() {
                var img = document.createElement("img");
                event.dataTransfer.setDragImage(img, 0, 0);
                event.dataTransfer.setData('text/plain', null)
            };


            function setTimeline() {
                var position = getPositionBar(event.clientX);
                scope.video.currentTime = position * scope.video.duration;
                inner.innerHTML = getstrtime(scope.video.currentTime);
                TweenMax.set(progressoutput, {
                    left: (position * 100) + '%'
                });
                TweenMax.set(progressoutput, {
                    left: (position * 100) + '%'
                });
                return position;
            };

            function getRandomSpan() {
                let random = Math.floor(1000 + Math.random() * 9000);
                return random
            }

            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            const stopInterval = (id) => {
                $interval.cancel(id);
                id = undefined;
            };

            $rootScope.$on('$destroy', () => stopInterval(IntervalID))

            function loadTimeLine(list_thumbnails) {
                if (controlbar.offsetWidth <= 0) {
                    return;
                }
                let widthpic = 50 * scope.video.clientWidth / scope.video.clientHeight;
                let total_thumbnail = Math.floor(controlbar.offsetWidth / widthpic);
                let number = getRandomSpan()
                inner_frames.innerHTML = '';
                let count = 0;
                let per_delta_image;
                let time = 0
                if (list_thumbnails && list_thumbnails.length > 0) {
                    per_delta_image = (list_thumbnails.length - 1) / total_thumbnail;
                }
                else {
                    per_delta_image = scope.video.duration / total_thumbnail;
                    time = 1000;
                }
                let thumnails = [];
                for (let i = 0; i <= total_thumbnail; i++) {
                    let video = document.createElement("video");
                    video.width = widthpic;
                    video.height = 50;
                    thumnails.push(video)
                    inner_frames.append(video);
                }
                IntervalID = $interval(async function () {
                    if (count <= total_thumbnail) {
                        if (list_thumbnails && list_thumbnails.length > 0) {
                            let index = Math.round(count * per_delta_image);
                            thumnails[count].poster = list_thumbnails[index].url + '?tag=' + number;
                            thumnails[count].className = 'loaded';
                        }
                        else {
                            thumnails[count].src = scope.video.src + '#t=' + (count * per_delta_image);
                            thumnails[count].preload = 'metadata';
                            thumnails[count].onloadeddata = function () {
                                this.className = 'loaded';
                            };
                        }
                        count += 1;
                    }
                    else {
                        stopInterval(IntervalID);
                    }
                }, time)

            }
        },
    }
}