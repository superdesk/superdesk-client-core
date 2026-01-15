import React from 'react';
import {showModal} from '@sourcefabric/common';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

export function showConfirmationPrompt(
    {title, message, primaryActionText}: {title: string; message: string; primaryActionText?: string;},
): Promise<boolean> {
    return new Promise((resolve) => {
        showModal(({closeModal}) => (
            <Modal
                visible
                size="small"
                position="center"
                onHide={() => {
                    closeModal();
                    resolve(false);
                }}
                data-test-id="confirmation-modal"
                headerTemplate={title}
                footerTemplate={(
                    <ButtonGroup align="end" orientation="horizontal">
                        <Button
                            onClick={() => {
                                closeModal();
                                resolve(false);
                            }}
                            text={gettext('Cancel')}
                            type="tertiary"
                        />
                        <Button
                            onClick={() => {
                                closeModal();
                                resolve(true);
                            }}
                            text={primaryActionText ?? gettext('Confirm')}
                            type="primary"
                        />
                    </ButtonGroup>
                )}
            >
                {message}
            </Modal>
        ));
    });
}
