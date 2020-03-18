import {get} from 'lodash';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';

/**
 * @ngdoc controller
 * @module superdesk.apps.authoring
 * @name ChangeImageController
 *
 * @requires $scope
 * @requires notify
 * @requires modal
 * @requires lodash
 * @requires api
 * @requires $rootScope
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

ChangeImageController.$inject = ['$scope', 'notify', 'lodash', 'api', '$rootScope', '$q'];
export function ChangeImageController($scope, notify, _, api, $rootScope, $q) {
    $scope.data = $scope.locals.data;
    $scope.data.cropData = {};
    $scope.validator = appConfig.validator_media_metadata;
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
        'keywords',
        'extra',
    ].concat(Object.keys(get(appConfig.schema, 'picture', {})));

    $scope.controls = angular.copy(DEFAULT_CONTROLS);

    $scope.showMetadata = $scope.data.showMetadata;
    $scope.nav = $scope.data.defaultTab || 'view';
    $scope.tabs = $scope.data.tabs || ['view', 'image-edit', 'crop'];

    $scope.metadata = {
        isDirty: false,
    };

    $scope.crops = {
        isDirty: false,
    };
    $scope.toggleShowMetadata = (value) => {
        $scope.showMetadata = value;
    };

    if ($scope.data.renditions) {
        $scope.data.renditions.forEach((rendition) => {
            const original = $scope.data.item.renditions.original;
            // only extend the item renditions if the original image can fit the rendition dimensions
            // otherwise we will get an error saving

            if (original && original.height >= rendition.height && original.width >= rendition.width) {
                sizes[rendition.name] = {width: rendition.width, height: rendition.height};
                $scope.data.cropData[rendition.name] = angular.extend({}, $scope.data.item.renditions[rendition.name]);
            }
        });
    }

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

    const _origCropsData = angular.copy($scope.data.cropData);

    if (_origCropsData && Object.keys(_origCropsData).length === 0) {
        $scope.data.isDirty = true;
    }

    /**
     * @ngdoc method
     * @name ChangeImageController#isDoneEnabled
     * @public
     * @description if dirty or is new picture item.
     * @returns {Boolean}
     */
    $scope.isDoneEnabled = function() {
        return !$scope.metadata.isDirty &&
            !$scope.controls.isDirty &&
            !$scope.crops.isDirty &&
            !$scope.isAoISelectionModeEnabled;
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#saveCrops
    * @public
    * @description Validate new crop-coordinates and resolve the promise and return
    * modified crop information, point of interest and metadata changes.
    */
    $scope.saveCrops = function() {
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
                if (!cropData || _.isEmpty(cropData)) {
                    throw gettext('Crop coordinates are not defined for {{cropName}} picture crop.', {cropName});
                }

                if (originalPoi.y < cropData.CropTop ||
                    originalPoi.y > cropData.CropBottom ||
                    originalPoi.x < cropData.CropLeft ||
                    originalPoi.x > cropData.CropRight) {
                    throw gettext('Point of interest outside the crop {{cropName}} limits', {cropName});
                }
            });
        }

        // check if data are valid
        try {
            if (appConfig.features != null && appConfig.features.validatePointOfInterestForImages === true) {
                poiIsInsideEachCrop();
            }
        } catch (e) {
            // show an error and stop the "done" operation
            notify.error(e);
            return false;
        }

        // update crop and poi data in `item`
        angular.extend($scope.data.item, $scope.data.metadata);
        $scope.data.item.poi = $scope.data.poi;
        $scope.data.metadata.poi = $scope.data.poi;

        $scope.crops.isDirty = false;
        $scope.data.isDirty = true;
        return true;
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#cancelCrops
    * @public
    * @description
    */
    $scope.cancelCrops = () => {
        $scope.data.cropData = angular.copy(_origCropsData);
        $scope.crops.isDirty = false;
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
        $rootScope.$broadcast('clear: selectedUsageTerms');
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
        if ($scope.data.isDirty || $scope.data.isNew) {
            if (
                $scope.data.item.type === 'picture'
                && appConfig.features != null
                && appConfig.features.validatePointOfInterestForImages === true
            ) {
                if (!$scope.saveCrops() || !$scope.applyMetadataChanges()) {
                    return;
                }
            }
            const data = {
                cropData: $scope.data.cropData,
                metadata: _.pick($scope.data.metadata, [
                    ...EDITABLE_METADATA,
                    'poi',
                    'renditions',
                    '_etag',
                ]),
            };

            generateCrops(data);
        } else {
            $scope.reject({done: true});
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

    function generateCrops(data) {
        const item = _.cloneDeep($scope.data.item);
        const renditions = _.cloneDeep($scope.data.renditions);
        const renditionNames = [];
        const savingImagePromises = [];

        $scope.loading = true;

        _.forEach(data.cropData, (croppingData, renditionName) => {
            const keys = ['CropLeft', 'CropTop', 'CropBottom', 'CropRight'];
            const canAdd = !keys.every((key) => {
                // if there a change in the crop co-ordinates
                const isSameCoords = item.renditions?.[renditionName]?.[key] === croppingData[key];

                return isSameCoords;
            });

            if (canAdd) {
                renditionNames.push(renditionName);
            }
        });

        // perform the request to make the cropped images
        renditionNames.forEach((renditionName) => {
            if (data.cropData?.[renditionName] !== item.renditions[renditionName]) {
                const rendition = renditions.find((_rendition) => renditionName === _rendition.name);
                const crop = {
                    ...data.cropData[renditionName],
                    // it should send the size we need, not the one we have
                    width: rendition.width,
                    height: rendition.height,
                };

                savingImagePromises.push(
                    api.save('picture_crop', {item: item, crop: crop}),
                );
            }
        });

        $q.all(savingImagePromises)
            .then((croppedImages) => {
                croppedImages.forEach((image, index) => {
                    const url = image.href;

                    // update association renditions
                    data.metadata.renditions[renditionNames[index]] = _.extend(
                        image.crop,
                        {
                            href: url,
                            width: image.width,
                            height: image.height,
                            media: image._id,
                            mimetype: image.item.mimetype,
                        },
                    );
                });

                $scope.resolve(data.metadata);
            })
            .catch(() => {
                notify.error(gettext('Failed to generate picture crops.'));
                $scope.reject({done: true});
            }).finally(() => {
                $scope.loading = false;
            });
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
                $scope.crops.isDirty = true;
            }
        });
    };

    // init poi if not set
    if (!$scope.data.poi || !Object.keys($scope.data.poi).length) {
        $scope.data.poi = {x: 0.5, y: 0.5};
        if (!(appConfig.features != null && appConfig.features.validatePointOfInterestForImages)) {
            $scope.saveCrops(); // save it as defaults
        }
    }
}
