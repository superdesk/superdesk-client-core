
import {get} from 'lodash';
import {TweenMax, Power2, TimelineLite} from "gsap/TweenMax";
import {gettext} from "superdesk-core/scripts/core/utils";

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
    $scope.addThumbnail = {};
    $scope.cuttingVideo = {};

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

    $scope.crops = {
        isDirty: false,
    };
    $scope.editVideo = {
        isDirty: false,
    };

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
        $scope.cuttingVideo = {
            starttime: starttime,
            endtime: endtime
        }
        $scope.addThumbnail = angular.copy(cache_addThumbnail)
    };

    /**
     * @ngdoc method
     * @name ChangeImageController#cancelMetadataChanges
     * @public
     * @description
     */
    $scope.cancelEditVideo = () => {
        $scope.editVideo.isDirty = false;
        starttime = $scope.cuttingVideo.starttime;
        endtime = $scope.cuttingVideo.endtime;
        var position = endtime / video.duration;
        TweenMax.set(cbwrapper, {
            right: ((1 - position) * 100) + '%'
        });
        TweenMax.set(maskright, {
            width: ((1 - position) * 100) + '%'
        });
        barright.setAttribute("data-content", getstrtime(position * video.duration));
        var position = starttime / video.duration
        TweenMax.set(cbwrapper, {
            left: (position * 100) + '%'
        });
        TweenMax.set(maskleft, {
            width: (position * 100) + '%'
        });
        barleft.setAttribute("data-content", getstrtime(position * video.duration));
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
            video =  document.getElementById('video');
            var output = document.getElementById('output');
            var canvas = drawObjectToCanvas(video, video.videoHeight, video.videoWidth);
            var file = document.getElementById("file-upload")
            output.innerHTML = '';
            canvas.id = "canvas-thumnail";
            canvas.style = "max-width: 100%;";
            file.value = "";
            output.append(canvas);
            cache_addThumbnail = {
                type: "capture",
                minetype: "image/png",
                time: time
            };
            $scope.editVideo.isDirty = true;
        } catch (e) {
            throw gettext(e.message);
        }
    };


    function drawObjectToCanvas(object, height, width) {
        var canvas = document.createElement('canvas');
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
    var mins = 0, secs = 0, li = 0, cache_addThumbnail = {}, starttime = 0, endtime = 0;

    /**
     * @ngdoc method
     * @name ChangeVideoController#videoInit
     * @public
     * @description Capture the thumbnail video at play time in time line.
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
            endtime = video.duration;
            $scope.cuttingVideo = {
                starttime: starttime,
                endtime: endtime
            }
            barright.setAttribute("data-content", getstrtime(video.duration));
            barleft.setAttribute("data-content", getstrtime(0));
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
                    canvas.style = "max-width: 100%;";
                    output.append(canvas);
                    $scope.editVideo.isDirty = true;
                    cache_addThumbnail = {
                        type: "upload",
                        minetype: "image/png",
                        data: canvas.toDataURL()
                    };
                }
                fr.onload = function () {
                    img.src = fr.result;
                }
                fr.readAsDataURL(files[0]);
            }
        }
    };

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
            if ($scope.cuttingVideo)
            {
                if($scope.cuttingVideo.starttime == 0 && $scope.cuttingVideo.endtime == video.duration)
                {
                    $scope.cuttingVideo = null;
                }
            }
            alert($scope.cuttingVideo.starttime);
            $scope.resolve({
                addThumbnail: $scope.addThumbnail,
                cuttingVideo: $scope.cuttingVideo,
                metadata: _.pick($scope.data.metadata, [
                    ...EDITABLE_METADATA,
                    'poi',
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

}