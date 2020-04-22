import React from 'react';
import ReactDOM from 'react-dom';

import {ModalPrompt} from 'core/ui/components/Modal/ModalPrompt';
import {gettext} from 'core/utils';
import Button from 'core/ui/components/Button';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';

export const showModal = (Component: React.ComponentType<{closeModal(): void}>): Promise<void> => {
    const el = document.createElement('div');

    document.body.appendChild(el);

    const closeModal = () => {
        ReactDOM.unmountComponentAtNode(el);
        el.remove();
    };

    ReactDOM.render(
        (
            <Component closeModal={closeModal} />
        ),
        el,
    );

    return Promise.resolve();
};

function getErrorsModal(
    title: string,
    errors: Array<string>,
    description?: string,
) {
    return class ErrorsModal extends React.PureComponent<{closeModal(): void}> {
        render() {
            return (
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>{title}</ModalHeader>
                    <ModalBody>
                        {
                            description == null ? null : (
                                <h3>{description}</h3>
                            )
                        }

                        {
                            errors.map((message, i) => (
                                <p key={i}>{message}</p>
                            ))
                        }
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={this.props.closeModal}>
                            {gettext('Ok')}
                        </Button>
                    </ModalFooter>
                </Modal>
            );
        }
    };
}

export function showErrorsModal(
    title: string,
    errors: Array<string>,
) {
    showModal(getErrorsModal(title, errors));
}

export default angular.module('superdesk.core.services.modal', [
    'superdesk-ui',
    'superdesk.core.services.asset',
    'superdesk.core.translate',
])
    .service('modal', ['$q', '$modal', '$sce', 'asset', function($q, $modal, $sce, asset) {
        const defaults = {
            bodyText: '',
            headerText: gettext('Confirm'),
            okText: gettext('OK'),
            cancelText: gettext('Cancel'),
            additionalCancelText: null,
        };

        function confirmArgumentsList(
            bodyText = defaults.bodyText,
            headerText = defaults.headerText,
            okText = defaults.okText,
            cancelText = defaults.cancelText,
            additionalCancelText = defaults.additionalCancelText,
        ) {
            return confirmBase(bodyText, headerText, okText, cancelText, additionalCancelText);
        }

        function confirmConfigurationObject(options) {
            const nextOptions = {...defaults, ...options};

            return confirmBase(
                nextOptions.bodyText,
                nextOptions.headerText,
                nextOptions.okText,
                nextOptions.cancelText,
                nextOptions.additionalCancelText,
            );
        }

        function confirmBase(
            bodyText,
            headerText,
            okText,
            cancelText,
            additionalCancelText,
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
                }],
            });

            return delay.promise;
        }

        this.confirm = function() {
            if (typeof arguments[0] === 'object' && arguments.length === 1) {
                return confirmConfigurationObject.apply(this, arguments);
            } else {
                return confirmArgumentsList.apply(this, arguments);
            }
        };

        this.alert = function(options) {
            return confirmConfigurationObject.call(this, {...options, cancelText: null});
        };

        this.createCustomModal = function() {
            return new Promise((resolve) => {
                $modal.open({
                    template: '<div id="custom-modal-placeholder"></div>',
                    controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                        resolve({
                            openModal: (reactComponent) => {
                                setTimeout(() => {
                                    ReactDOM.render(
                                        reactComponent,
                                        document.querySelector('#custom-modal-placeholder'),
                                    );
                                });
                            },
                            closeModal: () => {
                                $modalInstance.close();
                                ReactDOM.unmountComponentAtNode(
                                    document.querySelector('#custom-modal-placeholder'),
                                );
                            },
                        });
                    }],
                });
            });
        };

        this.prompt = function(title, initialValue) {
            return new Promise((resolve, reject) => {
                this.createCustomModal()
                    .then(({openModal, closeModal}) => {
                        openModal(
                            <ModalPrompt
                                title={title}
                                initialValue={initialValue}
                                onSubmit={(value) => {
                                    closeModal();
                                    resolve(value);
                                }}
                                close={closeModal}
                            />,
                        );
                    });
            });
        };
    }]);
