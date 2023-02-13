import {appConfig} from 'appConfig';

MultiImageEditModalController.$inject = ['$scope', 'imagesOriginal', 'saveHandler'];
function MultiImageEditModalController($scope, imagesOriginal, saveHandler) {
    $scope.imagesOriginal = imagesOriginal;
    $scope.saveHandler = saveHandler;
    $scope.cancelHandler = () => $scope.$close();
    $scope.successHandler = () => $scope.$close();
    $scope.getThumbnailHtml = (image) => `<img src="${image.renditions.thumbnail.href}" />`;
    $scope.validator = appConfig.validator_media_metadata;
}

MultiImageEditService.$inject = ['$modal'];
export function MultiImageEditService($modal) {
    this.edit = (imagesOriginal, saveHandler) => {
        $modal.open({
            templateUrl: 'scripts/apps/search/views/multi-image-edit-modal.html',
            controller: MultiImageEditModalController,
            size: 'fullscreen',
            resolve: {
                imagesOriginal: () => imagesOriginal,
                saveHandler: () => saveHandler,
            },
        });
    };
}
