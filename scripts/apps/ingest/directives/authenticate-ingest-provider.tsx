import React from 'react';
import {gettext} from 'core/utils';
import {showModal} from '@superdesk/common';
import {Button, Modal} from 'superdesk-ui-framework/react';
import {Spacer} from 'core/ui/components/Spacer';

export function authenticateIngestProvider(actions: Array<{label: string; onClick(): void}>) {
    interface IProps {
        closeModal(): void;
    }

    class IngestAuthenticationModal extends React.PureComponent<IProps> {
        render() {
            return (
                <Modal
                    visible
                    zIndex={1050}
                    size="small"
                    position="top"
                    onHide={this.props.closeModal}
                    headerTemplate={gettext('Connect an account')}
                    footerTemplate={
                        (
                            <Button
                                text={gettext('Close')}
                                onClick={this.props.closeModal}
                            />
                        )
                    }
                >
                    <Spacer h gap="4" noGrow justifyContent="start">
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
                    </Spacer>
                </Modal>
            );
        }
    }

    setTimeout(() => { // timeout needed to prevent angular from closing the modal
        showModal(IngestAuthenticationModal);
    }, 100);
}
