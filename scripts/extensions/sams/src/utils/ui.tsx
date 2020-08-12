// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';

// Types
import {ISuperdesk} from 'superdesk-api';

import extension from '../extension';

export function showModalConnectedToStore(
    superdesk: ISuperdesk,
    Component: React.ComponentType<{closeModal(): void}>,
): Promise<void> {
    const store = extension.exposes.store;

    if (store == null) {
        return Promise.reject('SAMS store has not been initialised');
    }

    return superdesk.ui.showModal(
        ({closeModal}) => (
            <Provider store={store}>
                <Component closeModal={closeModal} />
            </Provider>
        ),
    );
}
