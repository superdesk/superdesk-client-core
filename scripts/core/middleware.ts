
type IMiddlewareFn = (arg0: any) => any;

export function applyMiddleware(middleware: Array<IMiddlewareFn>, params: object, key?: string): Promise<any> {
    return middleware.reduce(
        (accumulator, fn) => accumulator.then((result) => {
            if (key != null) {
                params[key] = result;
            }

            return fn(params);
        }),
        Promise.resolve(key != null ? params[key] : params),
    );
}
