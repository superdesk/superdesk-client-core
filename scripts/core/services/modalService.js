export default angular.module('superdesk.core.services.modal', ['superdesk-ui', 'superdesk.core.services.asset'])
    .service('modal', ['$q', '$modal', '$sce', 'asset', function($q, $modal, $sce, asset) {
        this.confirm = function(
            bodyText,
            headerText = gettext('Confirm'),
            okText = gettext('OK'),
            cancelText = gettext('Cancel'),
            additionalCancelText = null
        ) {
            var delay = $q.defer();

            $modal.open({
                templateUrl: asset.templateUrl('core/views/confirmation-modal.html'),
                controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                    $scope.headerText = $sce.trustAsHtml(headerText);
                    $scope.bodyText = $sce.trustAsHtml(bodyText);
                    $scope.okText = okText;
                    $scope.cancelText = cancelText;
                    $scope.additionalCancelText = additionalCancelText;

                    $scope.ok = function() {
                        delay.resolve(true);
                        $modalInstance.close();
                    };

                    $scope.cancel = function() {
                        delay.reject();
                        $modalInstance.dismiss();
                    };

                    $scope.additionalCancel = function() {
                        $modalInstance.dismiss();
                    };

                    $scope.close = function() {
                        $modalInstance.dismiss();
                    };
                }]
            });

            return delay.promise;
        };
    }]);