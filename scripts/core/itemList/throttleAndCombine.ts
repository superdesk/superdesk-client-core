import {throttle, ThrottleSettings, Cancelable} from 'lodash';

type IHandlerArray<T> = (value: Array<T>) => void;

export function throttleAndCombineArray<T>(
    fn: IHandlerArray<T>,
    wait: number,
    options?: ThrottleSettings,
): IHandlerArray<T> & Cancelable {
    let pendingValues: Array<T> = [];

    const after = () => {
        fn(pendingValues);

        pendingValues = [];
    };

    const throttled = throttle(after, wait, options);

    const before: IHandlerArray<T> & Cancelable = (items) => {
        pendingValues.push(...items);

        throttled();
    };

    before.cancel = () => throttled.cancel();
    before.flush = () => throttled.flush();

    return before;
}

type IHandlerSet<T> = (value: Set<T>) => void;

/**
 * When throttled function is called more frequently than specified via `wait` param,
 * it stores the sets in memory and after the wait times out
 * it then invokes the handler function with all stored values.
 */
export function throttleAndCombineSet<T>(
    fn: IHandlerSet<T>,
    wait: number,
    options?: ThrottleSettings,
): IHandlerSet<T> & Cancelable {
    let pendingValues: Set<T> = new Set();

    const after = () => {
        fn(pendingValues);

        pendingValues.clear();
    };

    const throttled = throttle(after, wait, options);

    const before: IHandlerSet<T> & Cancelable = (items) => {
        items.forEach((item) => {
            pendingValues.add(item);
        });

        throttled();
    };

    before.cancel = () => throttled.cancel();
    before.flush = () => throttled.flush();

    return before;
}

