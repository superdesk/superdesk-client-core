type IHandler<T> = (items: T) => void;

export function throttleAndCombine<T>(
    fn: IHandler<T>,
    combine: (a: T, b: T) => T,
    wait: number,
): IHandler<T> {
    let lastCall = Date.now();
    let queue: T | null = null;

    return (items: T) => {
        if (queue == null) {
            queue = items;
        } else {
            queue = combine(queue, items);
        }

        const milisecondsSinceLastCall = Date.now() - lastCall;

        if (milisecondsSinceLastCall >= wait) {
            fn(queue);

            queue = null;
            lastCall = Date.now();
        }
    };
}

export function throttleAndCombineArray<T>(
    fn: IHandler<Array<T>>,
    wait: number,
) {
    return throttleAndCombine(
        fn,
        (a, b) => a.concat(b),
        wait,
    );
}

export function throttleAndCombineSet<T>(
    fn: IHandler<Set<T>>,
    wait: number,
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
    );
}
