/**
 * Moves first array item to end n times
 */
export function arraySpinForward<T>(arr: Array<T>, times: number) {
    let copy = [...arr];

    for (let i = 0; i < times; i++) {
        const first = copy.splice(0, 1);

        copy = copy.concat(first);
    }

    return copy;
}

/**
 * Moves last array item to start n times
 */
export function arraySpinBackwards<T>(arr: Array<T>, times: number) {
    let copy = [...arr];

    for (let i = 0; i < times; i++) {
        const last = copy.splice(copy.length - 1, copy.length);

        copy = [...last, ...copy];
    }

    return copy;
}
