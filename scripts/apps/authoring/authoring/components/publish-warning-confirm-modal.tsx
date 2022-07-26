import React from 'react';

import {gettext} from 'core/utils';
import Button from 'core/ui/components/Button';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {showModal} from '@superdesk/common';

interface IProps {
    closeModal(): void;
}

export function getPublishWarningConfirmModal(
    warnings: Array<string>,
    publishingAction: () => any,
) {
    return new Promise((resolve, reject) => {
        class PublishWarningsModal extends React.PureComponent<IProps> {
            render() {
                return (
                    <Modal>
                        <ModalHeader onClose={this.props.closeModal}>{gettext('Confirm Publish Warnings')}</ModalHeader>
                        <ModalBody>
                            <ul>
                                {warnings.map((warning, index) => (
                                    <li key={index}>
                                        {warning}
                                    </li>
                                ))}
                            </ul>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" onClick={this.props.closeModal}>
                                {gettext('Cancel')}
                            </Button>
                            <Button
                                color="primary"
                                onClick={() => {
                                    publishingAction().then(resolve, reject);
                                    this.props.closeModal();
                                }}
                            >
                                {gettext('Confirm')}
                            </Button>
                        </ModalFooter>
                    </Modal>
                );
            }
        }

        showModal(PublishWarningsModal);
    });
}
