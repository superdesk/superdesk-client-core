import {ICallable} from 'superdesk-api';

interface ICache {
    args: Array<any>;
    result: any;
}

export function memoize<T extends ICallable>(func: T, maxCacheEntryCount = 1): T {
    let cache: Array<ICache> = [];

    return function(...args: Array<any>) {
        var cachedValue = cache.find(
            (entry) =>
                entry.args.length === args.length
                && entry.args.every((value, index) => value === args[index]),
        );

        if (cachedValue != null) {
            return cachedValue.result;
        }

        let result = func.apply(this, args);

        if (cache.length === maxCacheEntryCount) {
            cache.shift();
        }

        cache.push({args, result});

        return result;
    } as T;
}
