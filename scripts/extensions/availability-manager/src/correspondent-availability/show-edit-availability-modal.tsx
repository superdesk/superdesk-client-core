import * as React from 'react';
import {Modal} from 'superdesk-ui-framework/react';
import {showModal} from '@sourcefabric/common';
import {IUser} from 'superdesk-api';
import {AvailabilitySettings} from '../settings/availability-settings';

export function showEditAvailabilityModal(user: IUser) {
    showModal(({closeModal}) => (
        <Modal
            visible
            onHide={closeModal}
            headerTemplate={user.display_name}
        >
            <AvailabilitySettings user={user} />
        </Modal>
    ));
}