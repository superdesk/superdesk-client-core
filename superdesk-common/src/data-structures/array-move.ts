/**
 * Indexes are zero-based.
 * Does not mutate the original array.
 */
export function arrayMove<T>(arr: Array<T>, from: number, to: number): Array<T> {
    if (
        from < 0 || from > arr.length - 1
        || to < 0 || to > arr.length - 1
    ) {
        console.error('Out of range.');
        return arr;
    }

    const copy = [...arr];

    const item = copy.splice(from, 1)[0];

    copy.splice(to, 0, item);

    return copy;
}
