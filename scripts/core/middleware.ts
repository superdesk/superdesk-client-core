
type IMiddlewareFn = (arg0: any) => any;

export function applyMiddleware(middleware: Array<IMiddlewareFn>, params: any): Promise<any> {
    return middleware.reduce(
        (accumulator, fn) => accumulator.then(() => fn(params)),
        Promise.resolve(params),
    ).then(() => params);
}
