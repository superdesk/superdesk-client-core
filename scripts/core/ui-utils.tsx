import {showModal} from '@superdesk/common';
import {Modal} from 'superdesk-ui-framework/react';
import React from 'react';

export const ui = {
    alert: (message: string) => (
        showModal(({closeModal}) => {
            return (
                <Modal
                    visible
                    onHide={closeModal}
                    zIndex={1050}
                >
                    {message}
                </Modal>
            );
        })
    ),
};
