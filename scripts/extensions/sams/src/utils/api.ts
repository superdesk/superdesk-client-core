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
    '04001': (_error) => {
        for (let error of Object.keys(_error.errors!)) {
            for (let key of _error.errors![error]) {
                if (key === 'unique') {
                    return superdeskApi.localization.gettext('Error[{{number}}]: {{error}} not unique', {
                        number: _error.error,
                        error: error.toUpperCase(),
                    });
                } else if (key === 'required' || key === 'empty values not allowed') {
                    return superdeskApi.localization.gettext('Error[{{number}}]: {{error}} requried', {
                        number: _error.error,
                        error: error.toUpperCase(),
                    });
                }
            }
        }
        return superdeskApi.localization.gettext('Error[{{number}}]: {{description}}', {
            number: _error.error,
            description: _error.description,
        });
    },
};

export function getApiErrorMessage(error: IAPIError): string {
    if (API_ERRORS[error.error] != null) {
        return API_ERRORS[error.error](error);
    }
    return superdeskApi.localization.gettext('Error[{{number}}]: {{description}}', {
        number: error.error,
        description: error.description,
    });
}
