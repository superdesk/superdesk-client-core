import {generate} from 'json-merge-patch';

interface IOptions {
    /**
     * If current value is `undefined` and next value is `null`,
     * treat it as equal.
     */
    undefinedEqNull: boolean;
}

export function generatePatch<T>(a: Partial<T>, b: Partial<T>, options?: IOptions): Partial<T> {
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
