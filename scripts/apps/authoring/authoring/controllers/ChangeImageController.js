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
 * @requires config
 *
 * @description Controller is responsible for cropping pictures and setting Point of Interest for an image.
 */
ChangeImageController.$inject = ['$scope', 'gettext', 'notify', 'modal', 'lodash', 'api', '$rootScope', 'config', '$q'];
export function ChangeImageController($scope, gettext, notify, modal, _, api, $rootScope, config, $q) {
    $scope.data = $scope.locals.data;
    $scope.data.cropData = {};
    $scope.validator = config.validatorMediaMetadata;
    let sizes = {};

    $scope.data.renditions.forEach((rendition) => {
        let original = $scope.data.item.renditions.original;
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
        return $scope.data.isDirty || $scope.isNew;
    };

    /**
    * @ngdoc method
    * @name ChangeImageController#done
    * @public
    * @description Validate new crop-coordinates and resolve the promise and return
    * modified crop information, point of interest and metadata changes.
    */
    $scope.done = function() {
        /* Throw an exception if PoI is outisde of a crop */
        function poiIsInsideEachCrop() {
            let originalImage = $scope.data.metadata.renditions.original;
            let originalPoi = {x: originalImage.width * $scope.data.poi.x, y: originalImage.height * $scope.data.poi.y};

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
                let value = $scope.data.metadata[key];
                let regex = new RegExp('^\<*br\/*\>*$', 'i');

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
                'headline',
                'description_text',
                'archive_description',
                'alt_text',
                'byline',
                'copyrightholder',
                'usageterms',
                'copyrightnotice',
                'poi',
                'renditions'
            ])
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
                    let promise = $scope.reject();

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
            loaderForAoI: false,
            isAoIDirty: false
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
            let {width, height} = $scope.data.item.renditions.original;

            return width !== $scope.areaOfInterestData.CropRight - $scope.areaOfInterestData.CropLeft ||
                    height !== $scope.areaOfInterestData.CropBottom - $scope.areaOfInterestData.CropTop;
        }

        return false;
    }

    /**
    * @ngdoc method
    * @name ChangeImageController#saveAreaOfInterest
    * @public
    * @description Based on the new Area of Interest save the original image and crops.
    */
    $scope.saveAreaOfInterest = function(croppingData) {
        let [width, height] = [
            croppingData.CropRight - croppingData.CropLeft,
            croppingData.CropBottom - croppingData.CropTop
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

        $scope.loaderForAoI = true;
        api.save('picture_crop', {item: $scope.data.item, crop: croppingData})
            .then((result) => {
                angular.extend(result.item.renditions.original, {
                    href: result.href,
                    width: result.width,
                    height: result.height,
                    media: result._id
                });
                $scope.data.isDirty = true;
                return api.save('picture_renditions', {item: result.item, no_custom_crops: true}).then((item) => {
                    $scope.data.item.renditions = item.renditions;
                    $scope.data.metadata = $scope.data.item;
                    $scope.data.poi = {x: 0.5, y: 0.5};
                    $rootScope.$broadcast('poiUpdate', $scope.data.poi);
                });
            }, (response) =>
                $q.reject(response)
            )
            .then(() => {
                $scope.showAreaOfInterestView(false);
            }, (response) => {
                if (_.isObject(response.data) && angular.isDefined(response.data._message)) {
                    notify.error(gettext('Failed to save the area of interest: ' + response.data._message));
                } else {
                    notify.error(gettext('There was an error. Failed to save the area of interest.'));
                }

                $scope.loaderForAoI = false;
            });
    };

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
