import {showModal} from '@superdesk/common';
import {Modal} from 'superdesk-ui-framework/react';
import React from 'react';
import ng from 'core/services/ng';
import {gettext} from './utils';

export const ui = {
    alert: (message: string) => (
        showModal(({closeModal}) => {
            return (
                <Modal
                    position="top"
                    visible
                    onHide={closeModal}
                    zIndex={1050}
                >
                    {message}
                </Modal>
            );
        })
    ),
    confirm: (message: string, title?: string) => new Promise((resolve) => {
        ng.get('modal').confirm(message, title ?? gettext('Confirm'))
            .then(() => resolve(true))
            .catch(() => resolve(false));
    }),
};
