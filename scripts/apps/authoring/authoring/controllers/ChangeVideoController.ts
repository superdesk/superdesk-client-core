import { get } from 'lodash';
import { gettext } from 'core/utils';
import angular from "angular";


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

ChangeVideoController.$inject = ['$scope', '$interval', 'gettext', 'notify', 'lodash', 'api', '$rootScope',
    'deployConfig', '$q', 'config'];

export function ChangeVideoController($scope, $interval, gettext, notify, _, api, $rootScope, deployConfig, $q, config) {
    $scope.data = $scope.locals.data;
    $scope.thumbnail = {};
    $scope.cut = {};
    $scope.crop = {};
    $scope.rotate = { degree: 0 };
    $scope.quality = {};
    $scope.video = null;
    $scope.flag = true;
    $scope.listFrames = [];

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
    $scope.qualityVideo = {
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
    let stopIntervalID;
    $scope.saveEditVideo = function () {
        const videoEditing = document.querySelector('.video-editing');
        videoEditing.classList.add('video-loading');
        $scope.video.pause();
        $scope.listFrames = null;
        $scope.isAoISelectionModeEnabled = true;
        const cut = ($scope.cut.end - $scope.cut.start) === $scope.video.duration ? {} : $scope.cut;
        const rotate = $scope.rotate.degree % 360 === 0 ? {} : $scope.rotate;
        api.save("video_edit", {
            item: $scope.data.item,
            edit: {
                cut: cut,
                crop: $scope.crop,
                rotate: rotate,
                quality: $scope.quality,
            },
            thumbnail: $scope.thumbnail,
        })
            .then(
                response => {
                    const mediaID = response._id.media;
                    (function checkVideoProcessing(mediaID) {
                        stopIntervalID = $interval(async function () {
                            const item = await api.get(`/video_edit/${mediaID}`);
                            if (item.processing === false) {

                                stopInterval(stopIntervalID);
                                $scope.isAoISelectionModeEnabled = false;
                                $scope.$applyAsync()
                                {
                                    $scope.cancelEditVideo();
                                    $scope.data.item = angular.extend($scope.data.item, response._id);
                                    $scope.listFrames = null;
                                    $scope.video.height = item.metadata.height;
                                    $scope.video.width = item.metadata.width;

                                    loadListThumbnails();
                                    videoEditing.classList.remove('video-loading');
                                }
                            }
                        }, 2500);
                    })(mediaID);
                }
            ).catch(
                err => { console.log(err); videoEditing.classList.remove('video-loading'); }
            );
        $scope.editVideo.isDirty = false;
        $scope.data.isDirty = true;
        $scope.editVideo.isChange = true;
    };

    const stopInterval = (id) => {
        $interval.cancel(id);
        id = undefined;
    }

    $scope.$on('$destroy', () => stopInterval(stopIntervalID))


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
        $scope.cut = {
            start: 0,
            end: $scope.video.duration
        }
        loadImage();
        // disable crop video
        if (jcrop_api) {
            jcrop_api.release();
            jcrop_api.disable();
        }
        $scope.thumbnail = {}
        $scope.crop = {};
        $scope.quality = 0;
        $scope.rotate.degree = 0;
        let video = document.getElementById('video-preview');
        actRotate(video, $scope.rotate.degree);

        document.getElementById('rotateVideo').disabled = false;
        document.getElementById('toggleRatio').disabled = false;
    };

    /**
     * @ngdoc method
     * @name ChangeVideoController#captureThumbnail
     * @public
     * @description Capture the thumbnail video at play time in time line.
     */
    $scope.captureThumbnail = function () {
        try {
            var time = $scope.video.currentTime;
            var output = document.getElementById('output');
            var canvas = drawObjectToCanvas($scope.video, $scope.video.clientHeight, $scope.video.clientWidth);
            var file = document.getElementById("file-upload")
            output.innerHTML = '';
            canvas.id = "canvas-thumnail";
            file.value = "";
            output.append(canvas);
            var nothumbnail = document.getElementById('no-thumbnail');
            nothumbnail.style = "visibility: collapse";
            $scope.thumbnail = {
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
        var height = 230
        var width = 300
        var delta = height / width
        var object_delta = object_height / object_width
        var canvas = document.createElement('canvas');
        if (delta < object_delta) {
            var width = object_width * height / object_height

            var left = (300 - width) / 300 / 2 * 100;
            canvas.style = "left: " + left + "%; position: absolute;";
        } else {
            var height = object_height * width / object_width
            var top = (230 - height) / 230 / 2 * 100;
            canvas.style = "top: " + top + "%; position: absolute;";
        };

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
        if ($scope.video.paused) {
            if ($scope.video.currentTime > $scope.cut.end) {
                $scope.video.pause();
            } else {
                $scope.video.play();
            }
        } else {
            $scope.video.pause();
        }
    };

    $scope.uploadThumbnail = function () {
        document.getElementById("file-upload").click();
    }

    var jcrop_api;


    /**
     * @ngdoc method
     * @name ChangeVideoController#videoInit
     * @public
     * @description Capture the thumbnail video at play time in time line.     *
     */
    $scope.videoInit = function () {

        $scope.cut = {};
        $scope.video = document.getElementById('video');
        loadImage();
        $scope.video.onloadeddata = function () {
            $scope.$applyAsync(() => {
                $scope.cut = {
                    start: 0,
                    end: $scope.video.duration
                }
            });
            if ($scope.video) {
                if ($scope.video.videoWidth > 720) {
                    $scope.qualityVideo.is720 = true;
                }
                if ($scope.video.videoWidth > 480) {
                    $scope.qualityVideo.is480 = true;
                }
                if ($scope.video.videoWidth > 240) {
                    $scope.qualityVideo.is240 = true;
                }
                if ($scope.video.videoWidth > 120) {
                    $scope.qualityVideo.is120 = true;
                }
            }

        }

        loadListThumbnails()
    }

    $scope.uploadChange = function (element) {
        var tgt = event.target || window.event.srcElement,
            files = tgt.files;
        // FileReader support
        if (FileReader && files && files.length) {
            var fr = new FileReader();
            var img = document.createElement("img");
            img.onload = function () {
                var canvas = drawObjectToCanvas(img, $scope.video.offsetHeight, $scope.video.offsetWidth);
                var output = document.getElementById('output');
                output.innerHTML = '';
                canvas.id = "canvas-thumnail";
                output.append(canvas);
                $scope.editVideo.isDirty = true;
                var nothumbnail = document.getElementById('no-thumbnail');
                nothumbnail.style = "visibility: collapse";
                $scope.thumbnail = {
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
        $scope.$applyAsync(() => {
            $scope.editVideo.isDirty = true;
        });
    };


    $scope.onCutChange = function () {
        $scope.$applyAsync(() => {
            $scope.editVideo.isDirty = true;
        });
    };
    async function loadListThumbnails() {
        const res = await api.get(`/video_edit/${$scope.data.item.media}?action=thumbnails&amount=40`)
        // .then(function (res) {
        if (res && res.processing === false) {
            $scope.$applyAsync()
            {
                $scope.listFrames = res.thumbnails;
            }
        }
        else {
            await delay(2000);
            loadListThumbnails()
        }
        // })
        // .catch(function (err) { return console.log(err); });
    }
    function delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function loadImage() {
        if ('thumbnail' in $scope.data.item.renditions) {
            var img = document.createElement("img");
            img.src = $scope.data.item.renditions.thumbnail.href + '?tag=' + $scope.data.item._etag;
            img.onload = function () {
                var canvas = drawObjectToCanvas(img, img.height, img.width);
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

    /**
     * @ngdoc metho d
     * @name ChangeImageController#isDoneEnabled
     * @public
     * @description if dirty or is new picture item.
     * @returns {Boolean}
     */
    $scope.controlBarChange = function () {
        //loadTimeLine($scope.data.metadata.renditions['timeline'])
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
            $scope.resolve({
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
     * @name ChangeImageController#toggleMenuQuality
     * @public
     * @description The menu select to change quality of video
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
     * @description The menu select to crop video
     *
     */
    $scope.toggleMenuRatio = () => {
        if ($scope.video.play) {
            $scope.video.pause();
        }
        let theToggle = document.getElementById('toggleRatio');
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
        let theToggle = document.getElementById('toggleRatio');
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
                jcrop_api.setOptions({ setSelect: [0, 0, elementVideo.clientHeight, elementVideo.clientHeight] });
                break;
            case "4:3":
                jcrop_api.release();
                let xClassic = y * 4 / 3;
                let yClassic = x * 3 / 4;

                if (xClassic < x)
                    jcrop_api.setOptions({ setSelect: [0, 0, xClassic, y] });
                else
                    jcrop_api.setOptions({ setSelect: [0, 0, x, yClassic] });

                break;
            case "16:9":
                jcrop_api.release();
                let xWide = y * 16 / 9;
                let yWide = x * 9 / 16;

                if (xWide < x)
                    jcrop_api.setOptions({ setSelect: [0, 0, xWide, y] });
                else
                    jcrop_api.setOptions({ setSelect: [0, 0, x, yWide] });
                break;
            default:
                break;
        }

        if (jcrop_api) {
            jcrop_api.enable();
        }

        document.getElementById('rotateVideo').disabled = true;
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
                let degree = $scope.rotate.degree = $scope.rotate.degree - 90;
                actRotate(video, degree);
                break;

            case 'right':
                break;
            default:
                break;
        }
        document.getElementById('toggleRatio').disabled = true;
        $scope.editVideo.isDirty = true;
    }

    function actRotate(elementVideo, degree) {
        let scale = (degree / 90) % 2 ? (elementVideo.clientHeight / elementVideo.clientWidth) : 1;
        elementVideo.style.transform = `rotate(${degree}deg) scale(${scale})`;
        elementVideo.style.transition = `transform 0.3s`;

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

        $scope.quality = currentTarget.value;
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
        let delta_width = $scope.video.videoWidth / $scope.video.offsetWidth;
        let delta_height = $scope.video.videoHeight / $scope.video.offsetHeight;
        $scope.crop = {
            x: c.x * delta_width,
            y: c.y * delta_height,
            width: c.w * delta_width,
            height: c.h * delta_height,
        };
    };
}
