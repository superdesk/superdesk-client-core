import React from 'react';
import {showModal} from '@sourcefabric/common';
import {Button, Modal} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IUnsavedChangesModalOptions {
    onDiscard: () => void;
    onSave?: () => void | Promise<void>;
}

export function showUnsavedChangesModal({onDiscard, onSave}: IUnsavedChangesModalOptions): void {
    showModal(({closeModal}) => (
        <Modal
            visible
            size="small"
            position="top"
            onHide={closeModal}
            headerTemplate={gettext('Unsaved changes')}
            footerTemplate={(
                <>
                    <Button
                        type="tertiary"
                        text={gettext('Go back')}
                        onClick={closeModal}
                    />
                    <Button
                        type="secondary"
                        text={gettext('Don\'t save')}
                        onClick={() => {
                            closeModal();
                            onDiscard();
                        }}
                    />
                    <Button
                        type="primary"
                        text={gettext('Save')}
                        onClick={() => {
                            closeModal();
                            const saveResult = onSave?.();

                            if (saveResult instanceof Promise) {
                                saveResult.then(() => {
                                    onDiscard();
                                });
                            } else {
                                onDiscard();
                            }
                        }}
                    />
                </>
            )}
        >
            {gettext('You have unsaved changes. What would you like to do?')}
        </Modal>
    ));
}
