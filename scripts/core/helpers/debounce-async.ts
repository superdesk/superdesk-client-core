export interface IDebounced {
    (): void;
    cancel(): void;
}

/**
 * Promise returned by calling `fn` must use provided `abortController` to stop processing
 * on receiving abort signal and and reject with `{name: 'AbortError'}`.
 *
 * If .catch() is used on the promise returned by `fn`, it must rethrow if rejection is `{name: 'AbortError'}`.
 */
export function debounceAsync<T>(
    fn: (abortController: AbortController) => Promise<T>,
    timeout: number, // in miliseconds
    maxWait?, // in miliseconds, must be >= timeout
): IDebounced {
    let timer;
    let firstCallTimestamp = null;

    let promiseInProgress = false;
    let abortController: AbortController | null = null;

    let cancelled = false;

    const debouncedFn = () => {
        cancelled = false;

        if (firstCallTimestamp == null) {
            firstCallTimestamp = Date.now();
        }

        const accumulatedWait = Date.now() - firstCallTimestamp;

        if (promiseInProgress) {
            abortController.abort();
        } else if (accumulatedWait < Math.max((maxWait ?? 0) - timeout, timeout)) {
            clearTimeout(timer);

            timer = window.setTimeout(() => {
                promiseInProgress = true;

                abortController = new AbortController();

                fn(abortController)
                    .then((result) => {
                        firstCallTimestamp = null;
                        promiseInProgress = false;

                        return result;
                    })
                    .catch((err) => {
                        if (err?.name === 'AbortError') {
                            firstCallTimestamp = null;
                            promiseInProgress = false;

                            if (!cancelled) {
                                debouncedFn();
                            }
                        }
                    });
            }, timeout);
        }
    };

    debouncedFn.cancel = () => {
        if (promiseInProgress) {
            cancelled = true;
            abortController.abort();
        } else {
            clearTimeout(timer);
        }
    };

    return debouncedFn;
}
