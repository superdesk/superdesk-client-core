MultiImageEditModalController.$inject = ['$scope', 'imagesOriginal', 'saveHandler', 'deployConfig'];
function MultiImageEditModalController($scope, imagesOriginal, saveHandler, deployConfig) {
    $scope.imagesOriginal = imagesOriginal;
    $scope.saveHandler = saveHandler;
    $scope.closeHandler = () => $scope.$close();
    $scope.getImageUrl = (image) => image.renditions.thumbnail.href;
    $scope.validator = deployConfig.getSync('validator_media_metadata');
}

MultiImageEditService.$inject = ['$modal'];
export function MultiImageEditService($modal) {
    this.edit = (imagesOriginal, saveHandler) => {
        $modal.open({
            templateUrl: 'scripts/apps/search/views/multi-image-edit-modal.html',
            controller: MultiImageEditModalController,
            size: 'fullscreen modal--dark-ui',
            resolve: {
                imagesOriginal: () => imagesOriginal,
                saveHandler: () => saveHandler,
            },
        });
    };
}
