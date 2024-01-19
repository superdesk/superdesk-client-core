import {generate} from 'json-merge-patch';
import {IPatchingOptions} from 'superdesk-api';

export function generatePatch<T>(a: Partial<T>, b: Partial<T>, options?: IPatchingOptions): Partial<T> {
    const result = (generate(a, b) ?? {}) as Partial<T>;

    if (options?.undefinedEqNull === true) {
        for (const key of Object.keys(result)) {
            if (result[key] === null && typeof a[key] === 'undefined') {
                delete result[key];
            }
        }
    }

    return result;
}
