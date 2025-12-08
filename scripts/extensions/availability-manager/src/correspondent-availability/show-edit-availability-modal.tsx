import * as React from 'react';
import {Modal} from 'superdesk-ui-framework';
import {showModal} from '@sourcefabric/common';
import {IUser} from 'superdesk-api';
import {AvailabilitySettings} from '../settings/availability-settings';

/**
 * Requires a privilege `user_availability_manage`
 */
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