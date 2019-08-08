import { get, isEmpty } from 'lodash';
import angular from "angular";
import { validateMediaFieldsThrows } from './ChangeImageController';


/**
 * @ngdoc controller
 * @module superdesk.apps.authoring
 * @name ChangeVideoController
 *
 * @requires $scope
 * @requires interval
 * @requires gettext
 * @requires notify
 * @requires lodash
 * @requires api
 * @requires $rootScope
 * @requires deployConfig
 *
 * @description Controller is responsible for cropping pictures and setting Point of Interest for an image.
 */

ChangeVideoController.$inject = ['$scope', '$interval', 'gettext', 'notify', 'lodash', 'api', '$rootScope',
    'deployConfig', '$q', 'config'];

export function ChangeVideoController($scope, $interval, gettext, notify, _, api, $rootScope, deployConfig, $q, config) {
    $scope.data = $scope.locals.data;
    $scope.thumbnail = {};
    $scope.cut = {};
    $scope.crop = {};
    $scope.rotate = 0;
    $scope.quality = {};
    $scope.video = null;
    $scope.flag = true;
    $scope.listFrames=null;
    $scope.validator = deployConfig.getSync('validator_media_metadata');
    $scope.showMetadata = $scope.data.showMetadata;
    $scope.nav = $scope.data.defaultTab || 'view';
    $scope.hideTabs = $scope.data.hideTabs || [];

    $scope.metadata = {
        isDirty: false,
    };
    $scope.editVideo = {
        isDirty: false,
        isChange: false,
    };
    $scope.qualityVideo = {
        is720: false,
        is480: false,
        is240: false,
        is120: false,
    };

    $scope.isNew = $scope.data.isNew === true;

    $scope.data.isDirty = false;
    $scope.data.editable = true; // enable edit metadata field
    // should show the metadata form in the view
    $scope.data.showMetadataEditor = $scope.data.showMetadataEditor === true;
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
    // initialize metadata from `item`
    $scope.data.metadata = angular.copy($scope.data.item);
    $scope.videoReload = true;
    let stopIntervalID;

    /**
     * @ngdoc method
     * @name ChangeVideoController#saveEditVideo
     * @public
     * @description Validate cut, crop, rotate and call edit video.
     * Checking the status of edit video and release loading after video finish.
     */
    $scope.saveEditVideo = function () {
        const videoEditing = document.querySelector('.video-editing');
        videoEditing.classList.add('video-loading');
        $scope.video.pause();
        $scope.isAoISelectionModeEnabled = true;
        const cut = ($scope.cut.end - $scope.cut.start) === ($scope.video.duration || 0) ? {} : $scope.cut;
        $scope.rotate = $scope.rotate % 360
        api.save("video_edit", {
            item: $scope.data.item,
            edit: {
                trim: cut,
                crop: $scope.crop,
                rotate: $scope.rotate,
                quality: $scope.quality,
            },
        })
            .then(
                response => {
                    $scope.videoReload = false;
                    (function checkVideoProcessing() {
                        stopIntervalID = $interval(async function () {
                            const item = await api.get(`/video_edit/${response._id}?etag=${response._etag}`);
                            if (await item.processing.video === false) {
                                stopInterval(stopIntervalID);
                                clearJcrop();
                                $scope.isAoISelectionModeEnabled = false;
                                $scope.data.isDirty = true;
                                api.get(`/video_edit/${response._id}?action=timeline&amount=40`);
                                $scope.$applyAsync(() => {
                                    $scope.cancelEditVideo();
                                    $scope.data.item = angular.extend($scope.data.item, response.item);
                                    $scope.videoReload = true;
                                    videoEditing.classList.remove('video-loading');
                                })
                            }
                        }, 2500);
                    })();
                }
            ).catch(err => {
                notify.error(err.data._message);
                clearJcrop();
                $scope.isAoISelectionModeEnabled = false;
                videoEditing.classList.remove('video-loading');
            });
        $scope.editVideo.isDirty = false;
        $scope.data.isDirty = true;
        $scope.editVideo.isChange = true;
    };

    function clearJcrop() {
        if (jcrop_api) {
            jcrop_api.destroy();
            jcrop_api = null;
        }
    }

    const stopInterval = (id) => {
        $interval.cancel(id);
        id = undefined;
    };

    $scope.$on('$destroy', () => stopInterval(stopIntervalID))

    /**
     * @ngdoc method
     * @name ChangeVideoController#cancelEditVideo
     * @public
     * @description Cancel and reset all status edit video.
     */
    $scope.cancelEditVideo = function () {
        var file = document.getElementById("file-upload")
        file.value = "";
        $scope.editVideo.isChange = false;
        $scope.editVideo.isDirty = false;
        $scope.cut = {
            start: 0,
            end: $scope.video.duration || 0,
        };
        loadImage();
        // disable crop video
        if (jcrop_api) {
            jcrop_api.release();
            jcrop_api.disable();
        }
        $scope.thumbnail = {};
        $scope.crop = {};
        $scope.quality = 0;
        $scope.rotate = 0;
        let video = document.getElementById('video-preview');
        actRotate(video, $scope.rotate, 0);
        document.getElementById('rotateVideo').disabled = false;
        document.getElementById('toggleRatio').disabled = false;
    };

    /**
     * @ngdoc method
     * @name ChangeVideoController#captureThumbnail
     * @public
     * @description Capturing a frame of video via playing time, drop, rotate.
     */
    $scope.captureThumbnail = function () {
        try {
            let position = $scope.video.currentTime;
            let output = document.getElementById('output');
            let width = $scope.video.clientWidth;
            let height = $scope.video.clientHeight;
            let x = 0;
            let y = 0;
            if (!isEmpty($scope.crop)) {
                x = $scope.crop.x;
                y = $scope.crop.y;
                width = $scope.crop.width;
                height = $scope.crop.height;
            }
            var canvas = drawObjectToCanvas($scope.video, width, height, x, y);
            var file = document.getElementById("file-upload")
            output.innerHTML = '';
            canvas.id = "canvas-thumnail";
            file.value = "";
            output.append(canvas);
            actRotate(canvas, $scope.rotate, 0);
            var nothumbnail = document.getElementById('no-thumbnail');
            nothumbnail.style = "visibility: collapse";
            $scope.thumbnail = {
                type: "capture",
                minetype: "image/png",
                position: position,
                crop: angular.copy($scope.crop),
                rotate: $scope.rotate,
            };
            $scope.editVideo.isDirty = true;
        } catch (e) {
            throw gettext(e.message);
        }
    };

    function drawObjectToCanvas(object, width, height, x, y) {
        var canvas_height = 230
        var canvas_width = 300
        $scope.crop
        var delta = canvas_height / canvas_width
        var object_delta = height / width
        var canvas = document.createElement('canvas');
        if (delta < object_delta) {
            canvas_width = width * canvas_height / height;
        } else {
            canvas_height = height * canvas_width / width;
        };
        canvas.width = canvas_width;
        canvas.height = canvas_height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(object, x, y, width, height, 0, 0, canvas_width, canvas_height);
        return canvas;
    }

    /**
     * @ngdoc method
     * @name ChangeVideoController#playVideo
     * @public
     * @description Play and pause video.
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
     * @description Init data and loading timeline and preview thumbnail for UI edit.
     */
    $scope.videoInit = function () {
        $scope.cut = {};
        $scope.video = document.getElementById('video');
        loadImage();
        $scope.video.onloadeddata = function () {
            $scope.$applyAsync(() => {
                $scope.cut = {
                    start: 0,
                    end: $scope.video.duration || 0,
                };
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
            $scope.loadTimelineThumbnails();

        };
    };

    /**
     * @ngdoc method
     * @name ChangeVideoController#uploadChange
     * @public
     * @description Loading image when upload a file.
     */
    $scope.uploadChange = function (event) {
        var tgt = event.target || window.event.srcElement,
            files = tgt.files;
        // FileReader support
        if (FileReader && files && files.length) {
            var fr = new FileReader();
            var img = document.createElement("img");
            img.onload = function () {
                var canvas = drawObjectToCanvas(img, $scope.video.offsetWidth, $scope.video.offsetHeight, 0, 0);
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

    /**
     * @ngdoc method
     * @name ChangeVideoController#uploadChange
     * @public
     * @description Trigger 'save bar' when use cutting video.
     */
    $scope.onCutChange = function () {
        $scope.$applyAsync(() => {
            $scope.editVideo.isDirty = true;
        });
    };

    /**
     * @ngdoc method
     * @name ChangeVideoController#loadTimelineThumbnails
     * @public
     * @description Use for loading list thumbnails in timeline bar.
     */
    $scope.loadTimelineThumbnails = async function () {
        const res = await api.get(`/video_edit/${$scope.data.item._id}?etag=${$scope.data.item._etag}`)
        if (res && res.processing.thumbnails_timeline === false) {

            $scope.$applyAsync(() => {
                if ($scope.listFrames === res.thumbnails.timeline) {
                    $scope.reloadFrames();
                }
                else {
                    $scope.listFrames = res.thumbnails.timeline;
                }
            });
        }
        else {
            $scope.$applyAsync(() => {
                if ($scope.listFrames == null) {
                    $scope.reloadFrames();
                }
                else {
                    $scope.listFrames = null;
                }
            });
        }
    }

    /**
     * @ngdoc method
     * @name ChangeVideoController#reloadTimelineThumbnails
     * @public
     * @description Trigger event reload data of list thumbnails in timeline.
     */
    $scope.reloadTimelineThumbnails = function (reloadFrames) {
        $scope.reloadFrames = reloadFrames;
    }

    /**
     * @ngdoc method
     * @name ChangeVideoController#reloadTimelineThumbnails
     * @private
     * @description loading Image for preview thumbnail.
     */
    function loadImage() {
        if ('thumbnail' in $scope.data.item.renditions) {
            var img = document.createElement("img");
            img.src = $scope.data.item.renditions.thumbnail.href + '?tag=' + $scope.data.item._etag;
            img.onload = function () {
                var canvas = drawObjectToCanvas(img, img.width, img.height, 0, 0);
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
     * @ngdoc method
     * @name ChangeVideoController#isDoneEnabled
     * @public
     * @description if dirty or is new picture item.
     * @returns {Boolean}
     */
    $scope.isDoneEnabled = function () {
        return !$scope.metadata.isDirty &&
            !$scope.editVideo.isDirty &&
            !$scope.isAoISelectionModeEnabled;
    };

    /**
     * @ngdoc method
     * @name ChangeVideoController#done
     * @public
     * @description Validate new crop-coordinates and resolve the promise and return
     * modified crop information, point of interest and metadata changes.
     */
    $scope.done = () => {
        if ($scope.data.isDirty) {
            $scope.resolve({
                item: $scope.data.item,
                metadata: _.pick($scope.data.metadata, [
                    ...EDITABLE_METADATA,
                    'poi',
                    'renditions',
                    '_etag',
                ]),
            })
        }
        else {
            $scope.reject();
        }
    };

    // Area of Interest
    $scope.data.showAoISelectionButton = $scope.data.showAoISelectionButton === true;

    /**
     * @ngdoc method
     * @name ChangeVideoController#toggleMenuQuality
     * @public
     * @description The menu select to change quality of video
     *
     */
    $scope.toggleMenuQuality = () => {
        let elementIcon = document.getElementById('icon-change-quality');

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
     * @name ChangeVideoController#toggleMenuRatio
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
     * @name ChangeVideoController#cropVideo
     * @public
     * @description crop video
     *
     */
    $scope.cropVideo = (ratio, currentTarget) => {
        if (!jcrop_api) {
            $('#video').Jcrop({
                onSelect: showCoords,
                onchange: showCoords,
                //aspectRatio: null,
                minSize: [30, 30],
                //trueSize: [video.clientWidth, video.clientHeight],
                addClass: 'jcrop-dark',
                bgOpacity: .4

            }, function () {
                jcrop_api = this;
            });
        }
        jcrop_api.release();
        jcrop_api.disable();

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
     * @name ChangeVideoController#rotateVideo
     * @public
     * @description rotate video to the left
     *
     */
    $scope.rotateVideo = (direction) => {
        let video = document.getElementById('video-preview');
        switch (direction) {
            case 'left':
                let degree = $scope.rotate = $scope.rotate - 90;
                actRotate(video, degree, 0.3);
                break;

            case 'right':
                break;
            default:
                break;
        }
        document.getElementById('toggleRatio').disabled = true;
        $scope.editVideo.isDirty = true;
    }

    /**
     * @ngdoc method
     * @name ChangeVideoController#rotateVideo
     * @private
     * @description animation rotate video to the left
     *
     */
    function actRotate(elementVideo, degree, time) {
        let scale = (degree / 90) % 2 ? (elementVideo.clientHeight / elementVideo.clientWidth) : 1;
        elementVideo.style.transform = `rotate(${degree}deg) scale(${scale})`;
        elementVideo.style.transition = `transform ` + time + `s`;

        let iconRotate = document.getElementsByClassName('icon-rotate-custom')[0];
        if ((degree / 180) % 2 === 0)
            iconRotate.setAttribute("style", "color:#ffffff !important;");
        else
            iconRotate.setAttribute("style", "color:#01f18b !important;");
    }

    /**
     * @ngdoc method
     * @name ChangeVideoController#changeQualityVideo
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

    $scope.applyMetadataChanges = async () => {
        try {
            validateMediaFieldsThrows($scope.validator, $scope.data.metadata);
            api.save('archive', $scope.data.metadata, _.pick($scope.data.metadata, [
                ...EDITABLE_METADATA,
                'poi',
                'renditions',
                '_etag',
            ])).then(_ => {
                angular.extend($scope.data.item, _)
                $scope.metadata.isDirty = false;
                $scope.data.isDirty = true;
            });
        } catch (e) {
            // show an error and stop the "done" operation
            notify.error(e);
            return false;
        }

        return true;
    };

    $scope.cancelMetadataChanges = () => {
        $rootScope.$broadcast('clear: selectedUsageTerms');
        $scope.data.metadata = angular.copy($scope.data.item);
        $scope.metadata.isDirty = false;
    };
}
