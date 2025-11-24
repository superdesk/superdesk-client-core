import React from 'react';
import {showModal} from '@sourcefabric/common';
import {Button, Modal, Spacer} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

export function showConfirmationPrompt(
    {title, message}: {title: string; message: string;},
): Promise<boolean> {
    return new Promise((resolve) => {
        showModal(({closeModal}) => (
            <Modal
                visible
                size="small"
                position="top"
                onHide={() => {
                    closeModal();
                    resolve(false);
                }}
                data-test-id="confirmation-modal"
                headerTemplate={title}
                footerTemplate={(
                    <Spacer h gap="4" justifyContent="end" noGrow>
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
                            text={gettext('Confirm')}
                            type="primary"
                        />
                    </Spacer>
                )}
            >
                {message}
            </Modal>
        ));
    });
}
