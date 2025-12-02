import React from 'react';
import {showModal} from '@sourcefabric/common';
import {Button, Modal} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IUnsavedChangesModalOptions {
    onDiscard: () => void;
}

export function showUnsavedChangesModal({onDiscard}: IUnsavedChangesModalOptions): void {
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
                        type="secondary"
                        text={gettext('Don\'t save')}
                        onClick={() => {
                            closeModal();
                            onDiscard();
                        }}
                    />
                    <Button
                        type="primary"
                        text={gettext('Go back')}
                        onClick={closeModal}
                    />
                </>
            )}
        >
            {gettext('You have unsaved changes. What would you like to do?')}
        </Modal>
    ));
}
