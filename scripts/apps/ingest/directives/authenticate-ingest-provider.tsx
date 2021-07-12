import React from 'react';

import {gettext} from 'core/utils';
import {showModal} from 'core/services/modalService';
import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Button} from 'superdesk-ui-framework';

export function authenticateIngestProvider(actions: Array<{label: string; onClick(): void}>) {
    interface IProps {
        closeModal(): void;
    }

    class TestModal extends React.PureComponent<IProps> {
        render() {
            return (
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>
                        {gettext('Connect an account')}
                    </ModalHeader>

                    <ModalBody>
                        {
                            actions.map(({label, onClick}) => (
                                <Button
                                    key={label}
                                    text={label}
                                    type="primary"
                                    onClick={() => {
                                        onClick();
                                        this.props.closeModal();
                                    }}
                                />
                            ))
                        }
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            text={gettext('Close')}
                            onClick={this.props.closeModal}
                        />
                    </ModalFooter>
                </Modal>
            );
        }
    }

    setTimeout(() => { // timeout needed to prevent angular from closing the modal
        showModal(TestModal);
    }, 100);
}
