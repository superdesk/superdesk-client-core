import React from 'react';

import {gettext, gettextPlural} from 'core/utils';
import {showModal} from 'core/services/modalService';

import {Modal} from 'core/ui/components/Modal/Modal';
import {ModalHeader} from 'core/ui/components/Modal/ModalHeader';
import {ModalBody} from 'core/ui/components/Modal/ModalBody';
import {ModalFooter} from 'core/ui/components/Modal/ModalFooter';
import {Button} from 'core/ui/components';

interface IProps {
    closeModal(): void;
}

/**
 * In case publish is triggered by quick buttons, show confirmation dialog
 */
export function confirmQuickPublish(itemCount): Promise<void> {
    return new Promise((resolve) => {
        class ConfirmQuickPublishModal extends React.PureComponent<IProps> {
            render() {
                return (
                    <Modal>
                        <ModalHeader onClose={this.props.closeModal}>
                            {gettext('Publishing')}
                        </ModalHeader>
                        <ModalBody>
                            {gettextPlural(itemCount, 'Do you want to publish the article?', 'Do you want to publish the articles?')}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" onClick={this.props.closeModal}>
                                {gettext('Cancel')}
                            </Button>
                            <Button
                                color="primary"
                                onClick={() => {
                                    resolve();
                                    this.props.closeModal();
                                }}
                            >
                                {gettext('Publish')}
                            </Button>
                        </ModalFooter>
                    </Modal>
                );
            }
        }

        showModal(ConfirmQuickPublishModal);
    });
}
