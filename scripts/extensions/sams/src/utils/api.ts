// External Modules
import {generate} from 'json-merge-patch';

// Types
import {IAPIError} from '../interfaces';
import {superdeskApi} from '../apis';

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
export const API_ERRORS: Dictionary<string, (error: IAPIError) => string> = {
    '04002': (_error) =>
        superdeskApi.localization.gettext('Error[04002]: Invalid search query'),
};

export function getApiErrorMessage(error: IAPIError): string {
    if (API_ERRORS[error.error] != null) {
        return API_ERRORS[error.error](error);
    }
    if (error.errors?.name != null) {
        for (let key of error.errors.name) {
            if (key === 'unique') {
                return superdeskApi.localization.gettext('Error[{{number}}]: Name not unique', {
                    number: error.error,
                });
            } else if (key === 'required' || key === 'empty values not allowed') {
                return superdeskApi.localization.gettext('Error[{{number}}]: Name requried', {
                    number: error.error,
                });
            } else {
                return superdeskApi.localization.gettext('Error[{{number}}]: {{description}}', {
                    number: error.error,
                    description: error.description,
                });
            }
        }
    }
    return superdeskApi.localization.gettext('Error[{{number}}]: {{description}}', {
        number: error.error,
        description: error.description,
    });
}
