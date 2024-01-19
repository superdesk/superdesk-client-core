import React from 'react';
import {gettext} from 'core/utils';
import Button from 'core/ui/components/Button';
import {showModal} from '@superdesk/common';
import {ButtonGroup, Modal} from 'superdesk-ui-framework/react';

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
                    <Modal
                        visible
                        zIndex={1050}
                        size="small"
                        position="top"
                        onHide={this.props.closeModal}
                        headerTemplate={gettext('Confirm Publish Warnings')}
                        footerTemplate={
                            (
                                <ButtonGroup align="end">
                                    <Button
                                        type="default"
                                        text={gettext('Cancel')}
                                        onClick={this.props.closeModal}
                                    />
                                    <Button
                                        type="primary"
                                        text={gettext('Confirm')}
                                        onClick={() => {
                                            publishingAction().then(resolve, reject);
                                            this.props.closeModal();
                                        }}
                                    />
                                </ButtonGroup>
                            )
                        }
                    >
                        <ul>
                            {warnings.map((warning, index) => (
                                <li key={index}>
                                    {warning}
                                </li>
                            ))}
                        </ul>
                    </Modal>
                );
            }
        }

        showModal(PublishWarningsModal);
    });
}
