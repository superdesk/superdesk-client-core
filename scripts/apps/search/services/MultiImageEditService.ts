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
    saveHandler(origin): Promise<void>;
    closeHandler(): void;
}

MultiImageEditController.$inject = [
    '$scope',
    'deployConfig',
    'modal',
    'gettextCatalog',
];

export function MultiImageEditController(
    $scope: IScope,
    deployConfig,
    modal,
    gettextCatalog,
) {
    const saveHandler = $scope.saveHandler;

    $scope.origin = angular.copy($scope.images);

    let changes = {};

    $scope.validator = deployConfig.getSync('validator_media_metadata');

    $scope.$watch('images', (images: Array<any>) => {
        // add and remove images without losing metadata of the ones which stay
        const updatedImages = images.map((image) => {
            const existingImage = $scope.origin.find(({_id}) => _id === image._id);

            return existingImage != null ? existingImage : image;
        });

        $scope.origin = angular.copy(updatedImages);
    });

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
        const imagesForSaving = angular.copy($scope.origin);

        imagesForSaving.forEach((image) => {
            delete image.unselected;
        });

        saveHandler(imagesForSaving)
            .then(() => {
                changes = {};

                if (close) {
                    $scope.closeHandler();
                }
            });
    };

    $scope.close = () => {
        if ($scope.isDirty()) {
            modal.confirm(
                gettextCatalog.getString('You have unsaved changes, do you want to continue?'),
                gettextCatalog.getString('Confirm'),
            )
                .then(() => {
                    $scope.closeHandler();
                });
        } else {
            $scope.closeHandler();
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

MultiImageEditModalController.$inject = ['$scope', 'images', 'saveHandler'];
function MultiImageEditModalController($scope, images, saveHandler) {
    $scope.images = images;
    $scope.saveHandler = saveHandler;
    $scope.closeHandler = () => $scope.$close();
    $scope.getImageUrl = (image) => image.renditions.thumbnail.href;
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
    this.edit = (images, saveHandler) => {
        $modal.open({
            templateUrl: 'scripts/apps/search/views/multi-image-edit-modal.html',
            controller: MultiImageEditModalController,
            size: 'fullscreen modal--dark-ui',
            resolve: {
                images: () => images,
                saveHandler: () => saveHandler,
            },
        });
    };
}
