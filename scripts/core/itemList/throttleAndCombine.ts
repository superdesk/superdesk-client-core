import {throttle, ThrottleSettings} from 'lodash';

type IHandler<T> = (items: T) => void;

export function throttleAndCombine<T>(
    fn: IHandler<T>,
    combine: (a: T, b: T) => T,
    wait: number,
    options?: ThrottleSettings,
): IHandler<T> {
    let queue: T | null = null;

    const callbackThrottled = throttle(
        () => {
            fn(queue);

            queue = null;
        },
        wait,
        options,
    );

    return (items: T) => {
        if (queue == null) {
            queue = items;
        } else {
            queue = combine(queue, items);
        }

        callbackThrottled();
    };
}

export function throttleAndCombineArray<T>(
    fn: IHandler<Array<T>>,
    wait: number,
    options?: ThrottleSettings,
) {
    return throttleAndCombine(
        fn,
        (a, b) => a.concat(b),
        wait,
        options,
    );
}

/**
 * When throttled function is called more frequently than specified via `wait` param,
 * it stores the sets in memory and after the wait times out
 * it then invokes the handler function with all stored values.
 */
export function throttleAndCombineSet<T>(
    fn: IHandler<Set<T>>,
    wait: number,
    options?: ThrottleSettings,
) {
    return throttleAndCombine(
        fn,
        (a, b) => {
            var result = new Set<T>();

            a.forEach((item) => {
                result.add(item);
            });

            b.forEach((item) => {
                result.add(item);
            });

            return result;
        },
        wait,
        options,
    );
}
