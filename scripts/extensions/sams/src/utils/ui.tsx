// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';

// Types
import {ISuperdesk} from 'superdesk-api';

// Redux Actions & Selectors
import {getStore} from '../store';

export function showModalConnectedToStore<T = any>(
    superdesk: ISuperdesk,
    Component: React.ComponentType<{closeModal(): void}>,
    props?: T,
): Promise<void> {
    const store = getStore();

    if (store == null) {
        return Promise.reject('SAMS store has not been initialised');
    }

    return superdesk.ui.showModal(
        ({closeModal}) => (
            <Provider store={store}>
                <Component closeModal={closeModal} {...props ?? {}} />
            </Provider>
        ),
    );
}

export function getHumanReadableFileSize(fileSize: number): string {
    if (fileSize < 1024) {
        return fileSize + 'bytes';
    } else if (fileSize < 1048576) {
        return (fileSize / 1024).toFixed(1) + 'KB';
    } else {
        return (fileSize / 1048576).toFixed(1) + 'MB';
    }
}

export function getIconTypeFromMimetype(mimetype: string) {
    if (mimetype.startsWith('image/')) {
        return 'photo';
    } else if (mimetype.startsWith('video/')) {
        return 'video';
    } else if (mimetype.startsWith('audio/')) {
        return 'audio';
    } else {
        return 'text';
    }
}
