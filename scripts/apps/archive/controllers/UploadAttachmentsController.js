import '../styles/upload-attachments.scss';

UploadAttachmentsController.$inject = ['$scope'];
export function UploadAttachmentsController($scope) {
    $scope.saving = false;
    $scope.items = $scope.locals.data;
    $scope.save = () => $scope.resolve($scope.items);
    $scope.cancel = $scope.reject;
    $scope.cancelItem = (index) => $scope.items.splice(index, 1);
}
