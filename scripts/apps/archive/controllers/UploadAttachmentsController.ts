import _ from 'lodash';

UploadAttachmentsController.$inject = ['$scope', '$q', 'urls', 'upload'];
export function UploadAttachmentsController($scope, $q, urls, upload) {
    $scope.saving = false;
    $scope.items = $scope.locals.data;

    /**
     * Upload file
     */
    function uploadFile(item) {
        item.promise = urls
            .resource('attachments')
            .then((uploadURL) =>
                upload.start({
                    method: 'POST',
                    url: uploadURL,
                    data: {
                        media: item.file,
                        title: item.meta.title,
                        description: item.meta.description,
                        internal: item.meta.internal
                    }
                })
            )
            .then(
                (response) => {
                    item.attachment = response.data;
                    return item.attachment;
                },
                (error) => {
                    item.error = error;
                },
                (progress) => {
                    item.progress = (progress.loaded / progress.total) * 100.0;
                },
            );

        return item.promise;
    }

    // init
    $scope.items = $scope.locals.data.map((file) => ({file: file}));

    // upload files
    $scope.save = () => $q.all($scope.items.map(uploadFile))
        .then($scope.resolve);

    // close
    $scope.cancel = () => $scope.reject();

    // remove uploaded item
    $scope.cancelItem = (item) => {
        $scope.items = _.without($scope.items, item);
        if (!$scope.items.length) {
            $scope.cancel();
        }
    };
}
