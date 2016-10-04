ChangeImageController.$inject = ['$scope', 'gettext', 'notify', 'modal', '$q', 'lodash', 'api', '$rootScope', 'config',
    'authoringWorkspace', 'archiveService'];
export function ChangeImageController($scope, gettext, notify, modal, $q, _, api, $rootScope, config, authoringWorkspace,
    archiveService) {
    $scope.data = $scope.locals.data;
    $scope.data.cropData = {};
    $scope.data.requiredFields = config.requiredMediaMetadata;
    var sizes = {};

    $scope.data.renditions.forEach(function(rendition) {
        var original = $scope.data.item.renditions.original;
        // only extend the item renditions if the original image can fit the rendition dimensions
        // otherwise we will get an error saving
        if ((original.height >= rendition.height) && (original.width >= rendition.width)) {
            sizes[rendition.name] = {width: rendition.width, height: rendition.height};
            $scope.data.cropData[rendition.name] = angular.extend({}, $scope.data.item.renditions[rendition.name]);
        }
    });
    var poiOrig = angular.extend({}, $scope.data.poi);
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

    $scope.saveIsEnabled = function() {
        return $scope.data.isDirty || $scope.isNew;
    };

    /*
    * Records the coordinates for each crop sizes available and
    * notify the user and then resolve the activity.
    */
    $scope.done = function() {
        /* Throw an exception if PoI is outisde of a crop */
        function poiIsInsideEachCrop() {
            var originalImage = $scope.data.metadata.renditions.original;
            var originalPoi = {x: originalImage.width * $scope.data.poi.x, y: originalImage.height * $scope.data.poi.y};
            _.forEach($scope.data.cropData, function(cropData, cropName) {
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
            _.each($scope.data.requiredFields, function (key) {
                var value = $scope.data.metadata[key];
                var regex = new RegExp('^\<*br\/*\>*$', 'i');
                if (!!!value || value.match(regex)) {
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
        $scope.resolve({cropData: $scope.data.cropData, poi: $scope.data.poi});

        // update item
        archiveService.addTaskToArticle($scope.data.metadata);
        var item = authoringWorkspace.getItem();
        var meta = _.pick($scope.data.item, ['title', 'description', 'alt_text', 'credit', 'copyrightnotice', 'copyrightholder']);
        api.archive.update(item, meta).then(function() {
            notify.success(gettext('Crop changes have been recorded'));
        });
    };

    $scope.close = function() {
        if ($scope.data.isDirty) {
            modal.confirm(gettext('You have unsaved changes, do you want to continue?'))
            .then(function() { // Ok = continue w/o saving
                angular.extend($scope.data.poi, poiOrig);
                return $scope.reject();
            });
        } else {
            $scope.reject();
        }
    };

    // Area of Interest
    $scope.data.showAoISelectionButton = $scope.data.showAoISelectionButton === true;
    $scope.showAreaOfInterestView = function(show) {
        angular.extend($scope, {
            isAoISelectionModeEnabled: show === undefined || show,
            areaOfInterestData: {},
            loaderForAoI: false
        });
    };
    $scope.saveAreaOfInterest = function(croppingData) {
        $scope.loaderForAoI = true;
        api.save('picture_crop', {item: $scope.data.item, crop: croppingData})
        .then(function(result) {
            angular.extend(result.item.renditions.original, {
                href: result.href,
                width: result.width,
                height: result.height,
                media: result._id
            });
            $scope.data.isDirty = true;
            return api.save('picture_renditions', {item: result.item}).then(function(item) {
                $scope.data.item.renditions = item.renditions;
                $scope.data.metadata = $scope.data.item;
                $scope.data.poi = {x: 0.5, y: 0.5};
                $rootScope.$broadcast('poiUpdate', $scope.data.poi);
            });
        })
        .then(function() {
            $scope.showAreaOfInterestView(false);
        });
    };

    $scope.onChange = function(renditionName, cropData) {
        $scope.$applyAsync(function() {
            if (angular.isDefined(renditionName)) {
                $scope.data.cropData[renditionName] = angular.extend({}, cropData, sizes[renditionName]);
                $scope.data.isDirty = true;
            }
        });
    };
}
