import {get} from 'lodash';
import {TweenMax, Power2, TimelineLite} from "gsap/TweenMax";
import {gettext} from "superdesk-core/scripts/core/utils";
import {IArticle} from "superdesk-core/scripts/superdesk-interfaces/Article";
import angular = require("angular");

/**
 * @ngdoc controller
 * @module superdesk.apps.authoring
 * @name ChangeImageController
 *
 * @requires $scope
 * @requires gettext
 * @requires notify
 * @requires modal
 * @requires lodash
 * @requires api
 * @requires $rootScope
 * @requires deployConfig
 *
 * @description Controller is responsible for cropping pictures and setting Point of Interest for an image.
 */

export function validateMediaFieldsThrows(validator, metadata) {
    for (let key in validator) {
        const value = metadata[key];
        const regex = new RegExp('^\<*br\/*\>*$', 'i');

        if (validator[key].required && (!value || value.match(regex))) {
            throw gettext('Required field(s) missing');
        }
    }
}

ChangeVideoController.$inject = ['$scope', 'gettext', 'notify', 'lodash', 'api', '$rootScope',
    'deployConfig', '$q', 'config'];

export function ChangeVideoController($scope, gettext, notify, _, api, $rootScope, deployConfig, $q, config) {
    $scope.data = $scope.locals.data;
    $scope.addingThumbnail = {};
    $scope.cuttingVideo = {};
    $scope.croppingVideo = {};
    $scope.rotatingVideo = {};
    $scope.qualityVideo = {};

    $scope.validator = deployConfig.getSync('validator_media_metadata');
    const sizes = {};

    const DEFAULT_CONTROLS = {
        brightness: 1,
        contrast: 1,
        saturation: 1,
        rotate: 0,
        fliph: 0,
        flipv: 0,
        isDirty: false,
    };

    const EDITABLE_METADATA = [
        'subject', // required for "usage terms" and other fields based on vocabularies
        'headline',
        'description_text',
        'archive_description',
        'alt_text',
        'byline',
        'copyrightholder',
        'usageterms',
        'copyrightnotice',
        'place',
        'subject',
        'keywords',
    ].concat(Object.keys(get(deployConfig.getSync('schema'), 'picture', {})));

    $scope.controls = angular.copy(DEFAULT_CONTROLS);

    $scope.showMetadata = $scope.data.showMetadata;
    $scope.nav = $scope.data.defaultTab || 'view';
    $scope.hideTabs = $scope.data.hideTabs || [];

    $scope.metadata = {
        isDirty: false,
    };
    $scope.editVideo = {
        isDirty: false,
        isChange: false
    };
    $scope.quality = {
        is720: false,
        is480: false,
        is240: false,
        is120: false
    }
    $scope.data.isDirty = false;
    $scope.isNew = $scope.data.isNew === true;
    // should show the metadata form in the view
    $scope.data.showMetadataEditor = $scope.data.showMetadataEditor === true;
    // initialize metadata from `item`
    $scope.data.metadata = angular.copy($scope.data.item);


    /**
     * @ngdoc method
     * @name ChangeImageController#saveCrops
     * @public
     * @description Validate new crop-coordinates and resolve the promise and return
     * modified crop information, point of interest and metadata changes.
     */
    $scope.saveEditVideo = function () {
        $scope.editVideo.isDirty = false;
        $scope.data.isDirty = true;
        $scope.croppingVideo = positionCropVideo;
        $scope.cuttingVideo = {
            starttime: starttime,
            endtime: endtime
        };
        $scope.rotatingVideo = {degree: 360 + (rotate.left)};
        $scope.qualityVideo = {quality: qualityVideo};
        $scope.editVideo.isChange = true;
    };

    /**
     * @ngdoc method
     * @name ChangeImageController#cancelMetadataChanges
     * @public
     * @description
     */
    $scope.cancelEditVideo = function () {
        var file = document.getElementById("file-upload")
        file.value = "";
        $scope.editVideo.isChange = false;
        $scope.editVideo.isDirty = false;
        starttime = 0;
        video = document.getElementById('video');
        endtime = video.duration;
        TweenMax.set(cbwrapper, {
            right: '0%'
        });
        TweenMax.set(maskright, {
            width: '0%'
        });
        barright.setAttribute("data-content", getstrtime(endtime));
        var position = starttime / video.duration;
        TweenMax.set(cbwrapper, {
            left: '0%'
        });
        TweenMax.set(maskleft, {
            width: '0%'
        });
        barleft.setAttribute("data-content", getstrtime(starttime));
        if ($scope.addingThumbnail) {
            loadImage();
        }
        // disable crop video
        if (jcrop_api) {
            jcrop_api.release();
            jcrop_api.disable();
        }
        positionCropVideo = {};
        qualityVideo = 0;
        rotate = {left: 0};
        let video = document.getElementById('video-preview');
        if ($scope.rotatingVideo.degree)
            actRotate(video, $scope.rotatingVideo.degree);
        else
            actRotate(video, 0);
    };

    /**
     * @ngdoc method
     * @name ChangeVideoController#captureThumbnail
     * @public
     * @description Capture the thumbnail video at play time in time line.
     */
    $scope.captureThumbnail = function () {
        try {
            var time = video.currentTime;
            video = document.getElementById('video');
            var output = document.getElementById('output');
            var canvas = drawObjectToCanvas(video, video.videoHeight, video.videoWidth);
            var file = document.getElementById("file-upload")
            output.innerHTML = '';
            canvas.id = "canvas-thumnail";
            file.value = "";
            output.append(canvas);
            var nothumbnail = document.getElementById('no-thumbnail');
            nothumbnail.style = "visibility: collapse";
            $scope.addingThumbnail = {
                type: "capture",
                minetype: "image/png",
                time: time
            };
            $scope.editVideo.isDirty = true;
        } catch (e) {
            throw gettext(e.message);
        }
    };


    function drawObjectToCanvas(object, object_height, object_width) {
        var delta = 230 / 300
        var object_delta = object_height / object_width
        if (delta < object_delta) {
            var height = 230
            var width = object_width * 230 / object_height
        } else {
            var width = 300
            var height = object_height * 300 / object_width
        }
        var top = (230 - height) / 230 / 2 * 100;
        var canvas = document.createElement('canvas');
        canvas.style = "top: " + top + "%; position: absolute;";
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(object, 0, 0, width, height);
        return canvas;
    }

    /**
     * @ngdoc method
     * @name ChangeVideoController#captureThumbnail
     * @public
     * @description Capture the thumbnail video at play time in time line.
     */
    $scope.playVideo = () => {
        if (video.paused) {
            if (video.currentTime > endtime) {
                video.pause();
            } else {
                video.play();
            }
        } else {
            video.pause();
        }
    };
    $scope.uploadThumbnail = function () {
        document.getElementById("file-upload").click();
    }


    var video, progressoutput, controlbar, inner, maskleft, maskright, barleft, barright, cbwrapper, iconplay, iconstop;
    var mins = 0, secs = 0, li = 0, starttime = 0, endtime = 0;
    var positionCropVideo = {}, jcrop_api, rotate = {left: 0}, qualityVideo;

    /**
     * @ngdoc method
     * @name ChangeVideoController#videoInit
     * @public
     * @description Capture the thumbnail video at play time in time line.     *
     */
    $scope.videoInit = function () {
        video = document.getElementById('video');
        progressoutput = document.getElementsByClassName('progress-output')[0];
        inner = document.getElementById('inner-play');
        barleft = document.getElementById('bar-left');
        barright = document.getElementById('bar-right');
        controlbar = document.getElementsByClassName('control-bars')[0];
        cbwrapper = document.getElementById('cb-wrapper');
        maskleft = document.getElementById('mask-left');
        maskright = document.getElementById('mask-right');
        iconplay = document.getElementById('icon-play');
        iconstop = document.getElementById('icon-stop');

        video.onplay = function () {
            iconplay.style.display = 'none';
            iconstop.style.display = 'initial';
            TweenMax.ticker.addEventListener('tick', vidUpdate);
        };
        video.onpause = function () {
            iconplay.style.display = 'initial';
            iconstop.style.display = 'none';
            TweenMax.ticker.removeEventListener('tick', vidUpdate);
        };
        video.onended = function () {
            iconplay.style.display = 'initial';
            iconstop.style.display = 'none';
            TweenMax.ticker.removeEventListener('tick', vidUpdate);
        };
        video.onloadeddata = function () {
            starttime = 0;
            loadImage();
            endtime = video.duration;
            $scope.cuttingVideo = {
                starttime: starttime,
                endtime: endtime
            }
            barright.setAttribute("data-content", getstrtime(video.duration));
            barleft.setAttribute("data-content", getstrtime(0));
            if (video) {
                if (video.videoWidth > 720) {
                    $scope.quality.is720 = true;
                }
                if (video.videoWidth > 480) {
                    $scope.quality.is480 = true;
                }
                if (video.videoWidth > 240) {
                    $scope.quality.is240 = true;
                }
                if (video.videoWidth > 120) {
                    $scope.quality.is120 = true;
                }
            }

            $('#video').Jcrop({
                onSelect: showCoords,
                onchange: showCoords,
                aspectRatio: null,
                minSize: [200, 200],
                trueSize: [video.clientWidth, video.clientHeight],
                addClass: 'jcrop-dark',
                bgOpacity: .4

            }, function () {
                jcrop_api = this;
            });
            if (jcrop_api) {
                jcrop_api.release();
                jcrop_api.disable();
            };
        }

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

        document.getElementById('file-upload').onchange = function (evt) {
            var tgt = evt.target || window.event.srcElement,
                files = tgt.files;

            // FileReader support
            if (FileReader && files && files.length) {
                var fr = new FileReader();
                var img = document.createElement("img");
                img.onload = function () {
                    var canvas = drawObjectToCanvas(img, video.offsetHeight, video.offsetWidth);
                    var output = document.getElementById('output');
                    output.innerHTML = '';
                    canvas.id = "canvas-thumnail";
                    output.append(canvas);
                    $scope.editVideo.isDirty = true;
                    var nothumbnail = document.getElementById('no-thumbnail');
                    nothumbnail.style = "visibility: collapse";
                    $scope.addingThumbnail = {
                        type: "upload",
                        mimetype: "image/png",
                        data: canvas.toDataURL()
                    };
                }
                fr.onload = function () {
                    img.src = fr.result;
                }
                fr.readAsDataURL(files[0]);
            }
        }
        if ('timeline' in $scope.data.metadata.renditions && $scope.data.metadata.renditions.timeline.length > 0) {
            loadTimeLine($scope.data.metadata.renditions['timeline']);
        } else {
            loadTimeLine([]);
            api.save('video_edit', {action: 'timeline', item: $scope.data.metadata}).then(function (data) {
                angular.extend($scope.data.metadata, data.result)
                angular.extend($scope.data.item, data.result)
                var list_thumbnails = data.result.renditions.timeline;
                loadTimeLine(list_thumbnails);
                $scope.data.isDirty = true;
            });
        }

        var observer = new ResizeObserver(function (entries) {
            entries.forEach(function (entry) {
                loadTimeLine($scope.data.metadata.renditions['timeline'])
            });
        });
        observer.observe(controlbar);
    }

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

    function loadImage() {
        if ('thumbnail' in $scope.data.metadata.renditions) {
            var img = document.createElement("img");
            img.src = $scope.data.metadata.renditions.thumbnail.href
            img.onload = function () {
                var canvas = drawObjectToCanvas(img, video.offsetHeight, video.offsetWidth);
                var output = document.getElementById('output');
                output.innerHTML = '';
                canvas.id = "canvas-thumnail";
                output.append(canvas);
                var nothumbnail = document.getElementById('no-thumbnail');
                nothumbnail.style = "visibility: collapse";

            };
        } else {
            var output = document.getElementById('output');
            output.innerHTML = '';
            var nothumbnail = document.getElementById('no-thumbnail');
            nothumbnail.style = "visibility: visible";
        }
    }

    $scope.controlBarClick = function () {
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


    function vidUpdate() {
        TweenMax.set(progressoutput, {
            left: (video.currentTime / video.duration * 100) + "%"
        });
        inner.innerHTML = getstrtime(video.currentTime);
        if (video.currentTime > endtime) {
            video.pause();
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

    /**
     * @ngdoc metho d
     * @name ChangeImageController#isDoneEnabled
     * @public
     * @description if dirty or is new picture item.
     * @returns {Boolean}
     */
    $scope.controlBarChange = function () {
        loadTimeLine($scope.data.metadata.renditions['timeline'])
    };
    /**
     * @ngdoc metho d
     * @name ChangeImageController#isDoneEnabled
     * @public
     * @description if dirty or is new picture item.
     * @returns {Boolean}
     */
    $scope.isDoneEnabled = function () {
        return !$scope.metadata.isDirty &&
            !$scope.controls.isDirty &&
            !$scope.editVideo.isDirty &&
            !$scope.isAoISelectionModeEnabled;
    };


    /**
     * @ngdoc method
     * @name ChangeImageController#applyMetadataChanges
     * @public
     * @description
     */
    $scope.applyMetadataChanges = () => {
        try {
            validateMediaFieldsThrows($scope.validator, $scope.data.metadata);
        } catch (e) {
            // show an error and stop the "done" operation
            notify.error(e);
            return false;
        }

        $scope.metadata.isDirty = false;
        $scope.data.isDirty = true;
        return true;
    };

    /**
     * @ngdoc method
     * @name ChangeImageController#cancelMetadataChanges
     * @public
     * @description
     */
    $scope.cancelMetadataChanges = () => {
        $scope.data.metadata = angular.copy($scope.data.item);
        $scope.metadata.isDirty = false;
    };

    /**
     * @ngdoc method
     * @name ChangeImageController#done
     * @public
     * @description Validate new crop-coordinates and resolve the promise and return
     * modified crop information, point of interest and metadata changes.
     */
    $scope.done = () => {
        if ($scope.data.isDirty) {
            if (config.features.validatePointOfInterestForImages === true) {
                if (!$scope.saveEditVideo() || !$scope.applyMetadataChanges()) {
                    return;
                }
            }
            if ($scope.cuttingVideo) {
                if ($scope.cuttingVideo.starttime == 0 && $scope.cuttingVideo.endtime == video.duration) {
                    $scope.cuttingVideo = {};
                }
            }
            $scope.resolve({
                addingThumbnail: $scope.addingThumbnail,
                cuttingVideo: $scope.cuttingVideo,
                croppingVideo: $scope.croppingVideo,
                rotatingVideo: $scope.rotatingVideo,
                qualityVideo: $scope.qualityVideo,
                hasChange: $scope.editVideo.isChange,
                metadata: _.pick($scope.data.metadata, [
                    ...EDITABLE_METADATA,
                    'renditions',
                    '_etag',
                ]),
            });
        } else {
            $scope.reject();
        }
    };

// Area of Interest
    $scope.data.showAoISelectionButton = $scope.data.showAoISelectionButton === true;

    function extractEditableMetadata(metadata) {
        return _.pick(metadata, EDITABLE_METADATA);
    }

    /**
     * @ngdoc method
     * @name ChangeImageController#toggleMenu
     * @public
     * @description menu for crop video
     *
     */
    $scope.toggleMenu = () => {
        if (video.play) {
            video.pause();
        }

        let theToggle = document.getElementById('toggle');
        showHideToggleMenu(theToggle, 'on');
        return false;

    };

    /**
     * @ngdoc method
     * @name ChangeImageController#toggleMenuQuality
     * @public
     * @description menuRatio for crop video
     *
     */
    $scope.toggleMenuQuality = () => {

        let elementIcon = document.getElementById('icon-change-quality');
        let test = elementIcon.classList.contains('icon-chevron-down-thin');
        if (elementIcon.classList.contains('icon-chevron-down-thin') === false) {

            elementIcon.classList.remove('icon-chevron-up-thin');
            elementIcon.classList.add('icon-chevron-down-thin');
        } else {

            elementIcon.classList.remove('icon-chevron-down-thin');
            elementIcon.classList.add('icon-chevron-up-thin');
        }

        let theToggle = document.getElementById('toggleQuality');
        showHideToggleMenu(theToggle, 'on');
        return false;

    };

    /**
     * @ngdoc method
     * @name ChangeImageController#toggleMenuRatio
     * @public
     * @description menu for crop video
     *
     */
    $scope.toggleMenuRatio = () => {
        if (video.play) {
            video.pause();
        }
        let theToggle = document.getElementById('toggle');
        showHideToggleMenu(theToggle, 'on');
        return false;

    };


    /**
     * @ngdoc method
     * @name ChangeImageController#cropVideo
     * @public
     * @description crop video
     *
     */
    $scope.cropVideo = (ratio, currentTarget) => {
        if (jcrop_api) {
            jcrop_api.enable();
        }

        let theToggle = document.getElementById('toggle');
        showHideToggleMenu(theToggle, 'on');

        let self = currentTarget;
        let elementRatio = document.getElementsByClassName('ratio');
        [].forEach.call(elementRatio, function (el) {
            el.classList.remove('active');
        });
        self.classList.add("active");
        let elementVideo = document.getElementById('video');
        let ratio2;
        if (ratio === "1:1")
            ratio2 = 1 / 1;
        else if (ratio === "4:3")
            ratio2 = 4 / 3;
        else if (ratio === "16:9")
            ratio2 = 16 / 9;
        let x = elementVideo.clientWidth;
        let y = elementVideo.clientHeight;
        switch (ratio) {

            case "1:1":
                jcrop_api.release();
                jcrop_api.setOptions({setSelect: [0, 0, elementVideo.clientHeight, elementVideo.clientHeight]});
                break;
            case "4:3":
                jcrop_api.release();
                let xClassic = y * 4 / 3;
                let yClassic = x * 3 / 4;

                if (xClassic < x)
                    jcrop_api.setOptions({setSelect: [0, 0, xClassic, y]});
                else
                    jcrop_api.setOptions({setSelect: [0, 0, x, yClassic]});

                break;
            case "16:9":
                jcrop_api.release();
                let xWide = y * 16 / 9;
                let yWide = x * 9 / 16;

                if (xWide < x)
                    jcrop_api.setOptions({setSelect: [0, 0, xWide, y]});
                else
                    jcrop_api.setOptions({setSelect: [0, 0, x, yWide]});
                break;
            default:
                break;
        }

        $scope.editVideo.isDirty = true;

    }
    /**
     * @ngdoc method
     * @name ChangeImageController#rotateVideo
     * @public
     * @description rotate video to the left
     *
     */
    $scope.rotateVideo = (direction) => {
        let video = document.getElementById('video-preview');
        switch (direction) {
            case 'left':
                let degree = rotate.left = rotate.left - 90;
                actRotate(video, degree);
                break;

            case 'right':
                break;
            default:
                break;
        }

        $scope.editVideo.isDirty = true;
    }

    function actRotate(elementVideo, degree) {
        let scale = (degree / 90) % 2 ? (elementVideo.clientHeight / elementVideo.clientWidth) : 1;
        elementVideo.style.transform = `rotate(${degree}deg) scale(${scale})`;

        let iconRotate = document.getElementsByClassName('icon-rotate-custom')[0];
        if ((degree / 180) % 2 === 0)
            iconRotate.setAttribute("style", "color:#ffffff !important;");
        else
            iconRotate.setAttribute("style", "color:#01f18b !important;");
    }

    /**
     * @ngdoc method
     * @name ChangeImageController#qualityVideo
     * @public
     * @description change quality the video
     *
     */
    $scope.changeQualityVideo = (currentTarget) => {
        document.getElementById('txtQuality').innerText = currentTarget.value === 0 ? 'Same' : currentTarget.value + "p";
        let self = currentTarget;
        let elementQuality = document.getElementsByClassName('quality');
        [].forEach.call(elementQuality, function (el) {
            el.classList.remove('active');
        });
        self.classList.add("active");

        let theToggle = document.getElementById('toggleQuality');
        showHideToggleMenu(theToggle, 'on');

        qualityVideo = currentTarget.value;
        $scope.editVideo.isDirty = true;
    }

    function showHideToggleMenu(elem, className) {
        // hasClass
        function hasClass(elem, className) {
            return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
        }

        let newClass = ' ' + elem.className.replace(/[\t\r\n]/g, " ") + ' ';
        if (hasClass(elem, className)) {
            while (newClass.indexOf(" " + className + " ") >= 0) {
                newClass = newClass.replace(" " + className + " ", " ");
            }
            elem.className = newClass.replace(/^\s+|\s+$/g, '');
        } else {
            elem.className += ' ' + className;
        }

    }

    function showCoords(c) {
        // variables can be accessed here as
        // c.x, c.y, c.x2, c.y2, c.w, c.h
        let delta_width = video.videoWidth / video.offsetWidth;
        let delta_height = video.videoHeight / video.offsetHeight;
        positionCropVideo = {
            x: c.x * delta_width,
            y: c.y * delta_height,
            width: c.w * delta_width,
            height: c.h * delta_height,
        };
    };

}
