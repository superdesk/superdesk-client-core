import _ from 'lodash';

interface IScope extends ng.IScope {
    validator: any;
    origin: any;
    images: any;
    placeholder: any;
    isDirty: any;
    selectImage: any;
    onBlur: any;
    onChange: any;
    metadata: any;
    save: any;
    close: any;
    $close: any;
}

MultiImageEditController.$inject = ['$scope', 'deployConfig', 'modal', 'gettextCatalog', 'images', 'authoring'];
export function MultiImageEditController($scope: IScope, deployConfig, modal, gettextCatalog, images, authoring) {
    let changes = {};

    $scope.validator = deployConfig.getSync('validator_media_metadata');

    $scope.origin = angular.copy(images);
    $scope.images = angular.copy(images);

    $scope.placeholder = {};

    $scope.isDirty = () => !_.isEmpty(changes);

    $scope.selectImage = (image) => {
        image.unselected = !image.unselected;
        image.unselected
            ? _.remove($scope.images, (res: any) => res._id === image._id)
            : $scope.images.push(image);

        return updateMetadata();
    };

    $scope.onBlur = () => {
        _.map($scope.origin, (item) => {
            if (_.find($scope.images, (image) => image._id === item._id)) {
                _.merge(item, _.pick($scope.metadata, _.keys(changes)));
            }
        });
    };

    $scope.onChange = (field) => {
        changes[field] = true;
        $scope.placeholder[field] = '';
    };

    $scope.save = (close) => {
        angular.forEach(images, (image) => {
            authoring.save(image, _.find($scope.origin, (item) => item._id === image._id))
                .then(() => {
                    changes = {};
                });
        });

        if (close) {
            $scope.$close();
        }
    };

    $scope.close = () => {
        if ($scope.isDirty()) {
            modal.confirm(
                gettextCatalog.getString('You have unsaved changes, do you want to continue?'),
                gettextCatalog.getString('Confirm'),
            )
                .then(() => {
                    $scope.$close();
                });
        } else {
            $scope.$close();
        }
    };

    updateMetadata();

    function updateMetadata() {
        $scope.metadata = {
            headline: compare('headline'),
            description_text: compare('description_text'),
            archive_description: compare('archive_description'),
            alt_text: compare('alt_text'),
            byline: compare('byline'),
            copyrightholder: compare('copyrightholder'),
            usageterms: compare('usageterms'),
            copyrightnotice: compare('copyrightnotice'),
        };
    }

    function compare(value) {
        if (!$scope.images.length) {
            $scope.placeholder = {};
            return '';
        }

        let uniqueValue = true;
        let initialValue = _.find($scope.origin, (origImage) => origImage._id === $scope.images[0]._id);

        angular.forEach($scope.images, (image) => {
            let compareImage = _.find($scope.origin, (origImage) => origImage._id === image._id);

            if (initialValue[value] !== compareImage[value]) {
                uniqueValue = false;
            }
        });

        if (uniqueValue) {
            $scope.placeholder[value] = '';
            return initialValue[value];
        }

        $scope.placeholder[value] = '(multiple values)';

        return '';
    }
}

/**
 * @ngdoc service
 * @module superdesk.apps.search
 * @name multiImageEdit
 *
 * @requires $modal
 *
 * @description Service for editing metadata of multiple images at same time
 */
MultiImageEditService.$inject = ['$modal'];
export function MultiImageEditService($modal) {
    this.edit = (images) => {
        $modal.open({
            templateUrl: 'scripts/apps/search/views/multi-image-edit.html',
            controller: MultiImageEditController,
            size: 'fullscreen modal--dark-ui',
            resolve: {
                images: () => images,
            },
        });
    };
}
