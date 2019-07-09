import {extensions} from 'core/extension-imports.generated';
import {IExtensionActivationResult} from 'superdesk-api';

const prefix = '__internal__';

// Allows providing middlewares / extension points from the core

export function registerInternalExtension(name: string, activationResult: IExtensionActivationResult) {
    extensions[prefix + name] = {
        extension: {activate: () => Promise.resolve({})},
        manifest: {main: 'not-required-for-internal-extensions'},
        activationResult,
    };
}

export function unregisterInternalExtension(name: string) {
    delete extensions[prefix + name];
}
