import React from 'react';
import {showModal} from '@superdesk/common';
import {Button, Modal, Spacer} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

export function showConfirmationPrompt(
    {title, message, dataTestId}: {title: string; message: string; dataTestId?: string},
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
                data-test-id={dataTestId}
                headerTemplate={title}
                footerTemplate={(
                    <Spacer h gap="4" justifyContent="end" noGrow>
                        <Button
                            onClick={() => {
                                closeModal();
                                resolve(false);
                            }}
                            text={gettext('Cancel')}
                            style="filled"
                            type="default"
                        />
                        <Button
                            onClick={() => {
                                closeModal();
                                resolve(true);
                            }}
                            text={gettext('Confirm')}
                            style="filled"
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
