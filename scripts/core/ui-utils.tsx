import {showModal} from '@superdesk/common';
import {Modal} from 'superdesk-ui-framework/react';
import React from 'react';

type modalPosition =
'center'
| 'top'
| 'bottom'
| 'left'
| 'right'
| 'top-left'
| 'top-right'
| 'bottom-left'
| 'bottom-right';

export const ui = {
    alert: (message: string, position: modalPosition = 'top') => (
        showModal(({closeModal}) => {
            return (
                <Modal
                    position={position}
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
