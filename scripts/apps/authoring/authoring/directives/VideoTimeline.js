/* global _ */

import {TweenMax} from "gsap/TweenMax";


/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdItemCarousel
 *
 * @requires $timeout
 */
export function VideoTimeline() {
    return {
        scope: {
            video: '=',
            iconPlay: '=',
            iconStop: '=',
            startTime: '=',
            endTime: '=',
            listFrames: '=',
        },
        templateUrl: 'scripts/apps/authoring/views/video-timeline.html',
        link: function (scope, element) {
            var mins = 0;
            var secs = 0;
            var li = 0;
            var progressoutput = element.find('.progress-output');
            var inner = element.find('.progress-output');
            var barleft = element.find('.control-bar.cb-left')[0];
            var barright = element.find('.control-bar.cb-right')[0];
            var controlbar = element.find('control-bars');
            var cbwrapper = element.find('control-bars-wrapper');
            var maskleft = element.find('.mask.left')[0];
            var maskright = element.find('.mask.right')[0];

            scope.video.onplay = function () {
                TweenMax.ticker.addEventListener('tick', vidUpdate);
            };
            scope.video.onpause = function () {
                TweenMax.ticker.removeEventListener('tick', vidUpdate);
            };
            scope.video.onended = function () {
                TweenMax.ticker.removeEventListener('tick', vidUpdate);
            };

            function vidUpdate() {
                TweenMax.set(progressoutput, {
                    left: (video.currentTime / video.duration * 100) + "%"
                });
                inner.innerHTML = getstrtime(video.currentTime);
                var starttime = starttime;
                if (video.currentTime > endTime) {
                    video.pause();
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

            scope.controlBarClick = function () {
                var position = setTimeline();
                if (position * video.duration < starttime) {
                    TweenMax.set(cbwrapper, {
                        left: (position * 100) + '%'
                    });
                    TweenMax.set(maskleft, {
                        width: (position * 100) + '%'
                    });
                }
                if (position * video.duration > endtime) {
                    TweenMax.set(cbwrapper, {
                        right: ((1 - position) * 100) + '%'
                    });
                    TweenMax.set(maskright, {
                        width: ((1 - position) * 100) + '%'
                    });
                }
            };


            function getPositionBar() {
                var position = ((event.clientX - controlbar.getBoundingClientRect().left) / controlbar.offsetWidth);
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
                if (event.clientX == 0) {
                    return;
                }
                var position = getPositionBar();
                if (type == 'right') {
                    TweenMax.set(cbwrapper, {
                        right: ((1 - position) * 100) + '%'
                    });
                    TweenMax.set(maskright, {
                        width: ((1 - position) * 100) + '%'
                    });
                    barright.setAttribute("data-content", getstrtime(position * video.duration));
                    endtime = position * video.duration;
                } else {
                    TweenMax.set(cbwrapper, {
                        left: (position * 100) + '%'
                    });
                    TweenMax.set(maskleft, {
                        width: (position * 100) + '%'
                    });
                    barleft.setAttribute("data-content", getstrtime(position * video.duration));
                    starttime = position * video.duration;
                }
            };


            function onDragEndCb() {
                setTimeline();
                $scope.editVideo.isDirty = true;
                video.click();
            };

            function onDragStart() {
                var img = document.createElement("img");
                event.dataTransfer.setDragImage(img, 0, 0);
            };


            function setTimeline() {
                var position = getPositionBar();
                video.currentTime = position * video.duration;
                inner.innerHTML = getstrtime(video.currentTime);
                TweenMax.set(progressoutput, {
                    left: (position * 100) + '%'
                });
                TweenMax.set(progressoutput, {
                    left: (position * 100) + '%'
                });
                return position;
            };

            function loadTimeLine(list_thumbnails) {
                var widthpic = 88
                if (list_thumbnails && list_thumbnails.length > 0) {
                    widthpic = list_thumbnails[0].width
                }
                var inner_frames = document.getElementById('inner-frames');
                var total_thumbnail = Math.floor(controlbar.offsetWidth / widthpic);
                var per_index_image = 35 / total_thumbnail;
                if (inner_frames) {
                    inner_frames.innerHTML = '';
                    for (var i = 0; i <= total_thumbnail; i++) {
                        var index = Math.round(i * per_index_image);
                        var video = document.createElement("video");
                        video.width = widthpic;
                        video.height = 50;
                        if (list_thumbnails && list_thumbnails.length > 0) {
                            video.poster = list_thumbnails[index].href;
                        }
                        video.onloadeddata = function () {
                            video.className = 'loaded';
                        };
                        inner_frames.append(video);
                    }
                }
            }
        },
    }
}
