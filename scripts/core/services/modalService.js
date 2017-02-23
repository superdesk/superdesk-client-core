export default angular.module('superdesk.core.services.modal', ['ui.bootstrap', 'superdesk.core.services.asset'])
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
    }])
    .directive('sdModal', ['$document', function($document) {
        return {
            template: '',
            transclude: true,
            scope: {model: '=', onClose: '&'},
            link: function modalLinkFunction(scope, element, attrs, ctrl, transcludeFn) {
                let modalElem;

                scope.$watch('model', (model) => {
                    if (model && !modalElem) {
                        transcludeFn((clone, modalScope) => {
                            modalElem = angular.element('<div class="modal" data-backdrop="static" />')
                                .append(angular.element('<div class="modal-dialog"></div>')
                                    .append(angular.element('<div class="modal-content"></div>')
                                        .append(clone)
                                    )
                                );
                            modalElem.addClass(element.attr('class'));
                            modalElem.appendTo($document.find('body'));
                            modalElem.modal('show');
                            modalElem.on('hidden.bs.modal', () => {
                                modalElem.off();
                                modalElem.remove();
                                modalScope.$destroy();
                                modalElem = null;

                                // reset model if needed
                                if (scope.model) {
                                    scope.$applyAsync(() => {
                                        scope.onClose(); // first try handler
                                        scope.$applyAsync(() => {
                                            // didn't work out, do it manually
                                            // if there is '.' in model just set it and it should work,
                                            // but otherwise use $parent as workaround
                                            if (scope.model && attrs.model.indexOf('.') > -1) {
                                                scope.model = null;
                                            } else if (scope.model) {
                                                scope.$parent.$applyAsync(() => {
                                                    scope.$parent[attrs.model] = null;
                                                });
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    } else if (!model) {
                        hideIfActive();
                    }
                });

                scope.$on('$destroy', hideIfActive);

                // hide modal if is active
                function hideIfActive() {
                    if (modalElem) {
                        modalElem.modal('hide');
                    }
                }
            }
        };
    }]);
