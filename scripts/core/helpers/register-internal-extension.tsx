import {extensions} from 'appConfig';
import {IExtensionActivationResult, ICustomFieldType} from 'superdesk-api';

const prefix = '__internal__';

// Allows providing middlewares / extension points from the core

/**
 * Register contributions from custom field types as internal extensions.
 */
export function registerContributionsFromCustomFields(
    customFieldTypes: Array<ICustomFieldType<unknown, unknown, unknown, unknown>>,
) {
    for (const customFieldType of customFieldTypes) {
        if (customFieldType.contributions != null) {
            registerInternalExtension(
                `field-type--${customFieldType.id}`,
                {contributions: customFieldType.contributions},
            );
        }
    }
}

export function registerInternalExtension(name: string, activationResult: IExtensionActivationResult) {
    extensions[prefix + name] = {
        extension: {activate: () => Promise.resolve({})},
        activationResult,
        configuration: {},
    };

    registerContributionsFromCustomFields(activationResult.contributions?.customFieldTypes ?? []);
}

export function unregisterInternalExtension(name: string) {
    delete extensions[prefix + name];
}
