// External Modules
import {generate} from 'json-merge-patch';

export function generatePatch<T>(original: Partial<T>, updates: Partial<T>): Partial<T> {
    return (generate(original, updates) ?? {}) as Partial<T>;
}

export function hasItemChanged<T>(original: Partial<T>, updates: Partial<T>): boolean {
    return Object.keys(generatePatch(original, updates)).length > 0;
}
