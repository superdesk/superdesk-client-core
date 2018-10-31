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
ChangeImageController.$inject = ['$scope', 'gettext', 'notify', 'modal', 'lodash', 'api', '$rootScope',
    'deployConfig', '$q'];
export function ChangeImageController($scope, gettext, notify, modal, _, api, $rootScope, deployConfig, $q) {
    $scope.data = $scope.locals.data;
    $scope.data.cropData = {};
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
        'headline',
        'description_text',
        'archive_description',
        'alt_text',
        'byline',
        'copyrightholder',
        'usageterms',
        'copyrightnotice',
    ];

    $scope.controls = angular.copy(DEFAULT_CONTROLS);

    $scope.showMetadata = $scope.data.showMetadata;
    $scope.nav = $scope.data.defaultTab || 'view';
    $scope.hideTabs = $scope.data.hideTabs || [];

    $scope.data.renditions.forEach((rendition) => {
        const original = $scope.data.item.renditions.original;
        // only extend the item renditions if the original image can fit the rendition dimensions
        // otherwise we will get an error saving

        if (original.height >= rendition.height && original.width >= rendition.width) {
            sizes[rendition.name] = {width: rendition.width, height: rendition.height};
            $scope.data.cropData[rendition.name] = angular.extend({}, $scope.data.item.renditions[rendition.name]);
        }
    });

    $scope.data.isDirty = false;
    $scope.isNew = $scope.data.isNew === true;
    // should show the metadata form in the view
    $scope.data.showMetadataEditor = $scope.data.showMetadataEditor === true;
    // initialize metadata from `item`
    $scope.data.metadata = angular.copy($scope.data.item);
    $scope.selectedRendition = null;
    $scope.selectRendition = function(rendition) {
        if (!rendition) {
            $scope.selectedRendition = null;
        } else if ($scope.selectedRendition === null || $scope.selectedRendition.name !== rendition.name) {
            $scope.selectedRendition = rendition;
        }
    };

    /**
     * @ngdoc method
     * @name ChangeImageController#saveIsEnabled
     * @public
     * @description if dirty or is new picture item.
     * @returns {Boolean}
     */
    $scope.saveIsEnabled = function() {
        return !$scope.controls.isDirty && ($scope.data.isDirty || $scope.isNew);
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#done
    * @public
    * @description Validate new crop-coordinates and resolve the promise and return
    * modified crop information, point of interest and metadata changes.
    */
    $scope.done = function() {
        /* Throw an exception if PoI is outside of a crop */
        function poiIsInsideEachCrop() {
            const originalImage = $scope.data.metadata.renditions.original;

            if (!$scope.data.poi || !_.isFinite($scope.data.poi.x) || !_.isFinite($scope.data.poi.y)) {
                throw gettext('Point of interest is not defined.');
            }

            const originalPoi = {
                x: originalImage.width * $scope.data.poi.x,
                y: originalImage.height * $scope.data.poi.y,
            };

            _.forEach($scope.data.cropData, (cropData, cropName) => {
                if (originalPoi.y < cropData.CropTop ||
                    originalPoi.y > cropData.CropBottom ||
                    originalPoi.x < cropData.CropLeft ||
                    originalPoi.x > cropData.CropRight) {
                    throw gettext('Point of interest outside the crop ' + cropName + ' limits');
                }
            });
        }
        /* Throw an exception if a required metadata field is missing */
        function validateMediaFields() {
            _.each(Object.keys($scope.validator), (key) => {
                const value = $scope.data.metadata[key];
                const regex = new RegExp('^\<*br\/*\>*$', 'i');

                if ($scope.validator[key].required && (!value || value.match(regex))) {
                    throw gettext('Required field(s) missing');
                }
            });
        }

        // check if data are valid
        try {
            poiIsInsideEachCrop();
            if ($scope.data.showMetadataEditor) {
                validateMediaFields();
            }
        } catch (e) {
            // show an error and stop the "done" operation
            notify.error(e);
            return false;
        }

        // update crop and poi data in `item`
        angular.extend($scope.data.item, $scope.data.metadata);
        $scope.data.item.poi = $scope.data.poi;
        $scope.resolve({
            cropData: $scope.data.cropData,
            metadata: _.pick($scope.data.item, [
                ...EDITABLE_METADATA,
                'poi',
                'renditions',
                '_etag',
            ]),
        });
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#close
    * @public
    * @description Close the Change Image form.
    */
    $scope.close = function() {
        if ($scope.data.editable && $scope.data.isDirty) {
            modal.confirm(gettext('You have unsaved changes, do you want to continue?'))
                .then(() => {
                // Ok = continue w/o saving
                    const promise = $scope.reject();

                    return promise;
                });
        } else {
            $scope.reject();
        }
    };

    // Area of Interest
    $scope.data.showAoISelectionButton = $scope.data.showAoISelectionButton === true;

    /**
    * @ngdoc method
    * @name ChangeImageController#showAreaOfInterestView
    * @public
    * @description Open the area for interest view.
    */
    $scope.showAreaOfInterestView = function(show) {
        angular.extend($scope, {
            isAoISelectionModeEnabled: show === undefined || show,
            areaOfInterestData: {},
            showLoader: false,
            isAoIDirty: false,
        });
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#enableSaveAreaOfInterest
    * @public
    * @description Enable/Disable the Save button for Area of Interest
    * @returns {Boolean}
    */
    $scope.enableSaveAreaOfInterest = function() {
        $scope.$applyAsync(() => {
            $scope.isAoIDirty = isAreaOfInterestChanged();
        });
    };

    function isAreaOfInterestChanged() {
        if ($scope.areaOfInterestData && angular.isDefined($scope.areaOfInterestData.CropLeft)) {
            const {width, height} = $scope.data.item.renditions.original;

            return width !== $scope.areaOfInterestData.CropRight - $scope.areaOfInterestData.CropLeft ||
                    height !== $scope.areaOfInterestData.CropBottom - $scope.areaOfInterestData.CropTop;
        }

        return false;
    }

    function extractEditableMetadata(metadata) {
        return _.pick(metadata, EDITABLE_METADATA);
    }

    /**
    * @ngdoc method
    * @name ChangeImageController#saveAreaOfInterest
    * @public
    * @description Based on the new Area of Interest save the original image and crops.
    */
    $scope.saveAreaOfInterest = function(croppingData) {
        const [width, height] = [
            croppingData.CropRight - croppingData.CropLeft,
            croppingData.CropBottom - croppingData.CropTop,
        ];
        let validCrop = true;

        // check if new crop is valid or not.
        if (Object.keys(sizes)) {
            validCrop = Object.keys(sizes).every((key) => width >= sizes[key].width && height >= sizes[key].height);
        }

        if (!validCrop) {
            notify.error(gettext('Original size cannot be less than the required crop sizes.'));
            return;
        }

        $scope.showLoader = true;
        api.save('picture_crop', {item: $scope.data.item, crop: croppingData})
            .then((result) => {
                angular.extend(result.item.renditions.original, {
                    href: result.href,
                    width: result.width,
                    height: result.height,
                    media: result._id,
                });
                $scope.data.isDirty = true;
                return api.save('picture_renditions', {item: result.item, no_custom_crops: true}).then((item) => {
                    $scope.data.item.renditions = item.renditions;
                    const editableMetadata = extractEditableMetadata($scope.data.metadata);

                    $scope.data.metadata = Object.assign($scope.data.item, editableMetadata);
                    $scope.data.poi = {x: 0.5, y: 0.5};
                    $rootScope.$broadcast('poiUpdate', $scope.data.poi);
                });
            }, (response) =>
                $q.reject(response),
            )
            .then(() => {
                $scope.showAreaOfInterestView(false);
            }, (response) => {
                if (_.isObject(response.data) && angular.isDefined(response.data._message)) {
                    notify.error(gettext('Failed to save the area of interest: ' + response.data._message));
                } else {
                    notify.error(gettext('There was an error. Failed to save the area of interest.'));
                }

                $scope.showLoader = false;
            });
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#rotateImage
    * @public
    * @description Rotate image
    */
    $scope.rotateImage = (direction) => {
        switch (direction) {
        case 'left':
            $scope.controls.rotate = $scope.controls.rotate - 90;
            break;

        case 'right':
            $scope.controls.rotate = $scope.controls.rotate + 90;
            break;
        }

        return $scope.controls.isDirty = true;
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#flipImage
    * @public
    * @description Flip image
    */
    $scope.flipImage = (direction) => {
        switch (direction) {
        case 'horizontal':
            $scope.controls.fliph = $scope.controls.fliph + 180;
            break;

        case 'vertical':
            $scope.controls.flipv = $scope.controls.flipv + 180;
            break;
        }

        return $scope.controls.isDirty = true;
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#applyImageChanges
    * @public
    * @description Apply image modifications
    */
    $scope.applyImageChanges = () => {
        let flip = 'none',
            flipH = Math.abs($scope.controls.fliph / 180 % 2),
            flipV = Math.abs($scope.controls.flipv / 180 % 2);

        if (flipH === 1 && flipV === 1) {
            flip = 'both';
        } else if (flipH === 1 && flipV === 0) {
            flip = 'horizontal';
        } else if (flipH === 0 && flipV === 1) {
            flip = 'vertical';
        }

        $scope.loaderForMediaEdit = true;
        return api.save('media_editor', {item: $scope.data.item, edit: {
            brightness: $scope.controls.brightness,
            contrast: $scope.controls.contrast,
            saturation: $scope.controls.saturation,
            rotate: -$scope.controls.rotate,
            flip: flip,

        }}).then((result) => {
            $scope.data.item.renditions = result.renditions;
            $scope.data.item._etag = result._etag;
            const editableMetadata = extractEditableMetadata($scope.data.metadata);

            $scope.data.metadata = Object.assign($scope.data.item, editableMetadata);
            $scope.controls = angular.copy(DEFAULT_CONTROLS);
            $scope.data.isDirty = true;
            $scope.loaderForMediaEdit = false;
        });
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#setRatio
    * @public
    * @description Set image ratio
    */
    $scope.setRatio = (ratio) => {
        const originalImage = $scope.data.metadata.renditions.original;

        let sizeW, sizeH;

        switch (ratio) {
        case '16:9':
            sizeW = originalImage.width - (originalImage.height * 16 / 9);
            sizeH = originalImage.height - (originalImage.width * 9 / 16);
            break;

        case '4:3':
            sizeW = originalImage.width - (originalImage.height * 4 / 3);
            sizeH = originalImage.height - (originalImage.width * 3 / 4);
            break;

        case '3:2':
            sizeW = originalImage.width - (originalImage.height * 3 / 2);
            sizeH = originalImage.height - (originalImage.width * 2 / 3);
            break;

        default:
            sizeW = 0; sizeH = 0;
        }

        $scope.areaOfInterestData.CropTop = sizeH > 0 ? Math.round(sizeH / 2) : 0;
        $scope.areaOfInterestData.CropBottom = sizeH > 0 ?
            originalImage.height - Math.round(sizeH / 2) :
            originalImage.height;
        $scope.areaOfInterestData.CropLeft = sizeW > 0 ? Math.round(sizeW / 2) : 0;
        $scope.areaOfInterestData.CropRight = sizeW > 0 ?
            originalImage.width - Math.round(sizeW / 2) :
            originalImage.width;
    };

    $scope.resizeImage = (image) => {
        const originalImage = $scope.data.metadata.renditions.original;

        $scope.areaOfInterestData.CropTop = originalImage.height - image.height / 2;
        $scope.areaOfInterestData.CropBottom = originalImage.height - (originalImage.height - image.height / 2);
        $scope.areaOfInterestData.CropLeft = originalImage.width - image.width / 2;
        $scope.areaOfInterestData.CropRight = originalImage.width - (originalImage.width - image.width / 2);
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#cancelImageChanges
    * @public
    * @description Cancel image changes and set values back to default
    */
    $scope.cancelImageChanges = () => $scope.controls = angular.copy(DEFAULT_CONTROLS);

    /**
    * @ngdoc method
    * @name ChangeImageController#onChange
    * @public
    * @description Based on the new Area of Interest save the original image and crops.
    */
    $scope.onChange = function(renditionName, cropData) {
        $scope.$applyAsync(() => {
            if (angular.isDefined(renditionName)) {
                $scope.data.cropData[renditionName] = angular.extend({}, cropData, sizes[renditionName]);
                $scope.data.isDirty = true;
            }
        });
    };
}
