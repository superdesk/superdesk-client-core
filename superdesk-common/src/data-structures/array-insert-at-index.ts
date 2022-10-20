import {arrayMove} from './array-move';

/**
 * Indexes are zero-based.
 * Does not mutate the original array.
 */
export function arrayInsertAtIndex<T>(arr: Array<T>, item: T, index: number): Array<T> {
    const inserted = arr.concat([item]);

    return arrayMove(inserted, inserted.length - 1, index);
}
