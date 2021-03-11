import {extensions} from 'appConfig';
import {IExtensionActivationResult} from 'superdesk-api';

const prefix = '__internal__';

// Allows providing middlewares / extension points from the core

export function registerInternalExtension(name: string, activationResult: IExtensionActivationResult) {
    extensions[prefix + name] = {
        extension: {activate: () => Promise.resolve({})},
        activationResult,
    };
}

export function unregisterInternalExtension(name: string) {
    delete extensions[prefix + name];
}
