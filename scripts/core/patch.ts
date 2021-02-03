import {generate} from 'json-merge-patch';

export function generatePatch<T>(a: Partial<T>, b: Partial<T>): Partial<T> {
    return (generate(a, b) ?? {}) as Partial<T>;
}
