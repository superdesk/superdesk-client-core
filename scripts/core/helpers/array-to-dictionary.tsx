export function arrayToDictionary<T, V>(
    array: Array<T>,
    getKeyValue: (item: T) => ({key: string; value: V}),
): {[key: string]: V} {
    const result: {[key: string]: V} = {};

    for (const item of array) {
        const {key, value} = getKeyValue(item);

        result[key] = value;
    }

    return result;
}
