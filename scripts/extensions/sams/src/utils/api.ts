// External Modules
import {generate} from 'json-merge-patch';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IAPIError} from '../interfaces';

export function generatePatch<T>(original: Partial<T>, updates: Partial<T>): Partial<T> {
    return (generate(original, updates) ?? {}) as Partial<T>;
}

export function hasItemChanged<T>(original: Partial<T>, updates: Partial<T>): boolean {
    return Object.keys(generatePatch(original, updates)).length > 0;
}

export function isSamsApiError(error: any): boolean {
    return error?.error != null &&
        error?.name != null &&
        error?.description != null;
}

// Provide translations here, as the SAMS API does not currently support localisation
export const API_ERRORS: Dictionary<string, (superdesk: ISuperdesk, error: IAPIError) => string> = {
    '04002': (superdesk, _error) =>
        superdesk.localization.gettext('Error[04002]: Invalid search query'),
};

export function getApiErrorMessage(superdesk: ISuperdesk, error: IAPIError): string {
    if (API_ERRORS[error.error] != null) {
        return API_ERRORS[error.error](superdesk, error);
    }

    return superdesk.localization.gettext('Error[{{number}}]: {{description}}', {
        number: error.error,
        description: error.description,
    });
}
