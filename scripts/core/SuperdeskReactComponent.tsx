import React from 'react';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {noop} from 'lodash';

/**
 * Wraps a promise in order to ignore AbortError and break the promise chain when it occurs.
 */
function ignoreAbortError<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        promise
            .then(resolve)
            .catch((err) => {
                if (err?.name !== 'AbortError') {
                    reject(err);
                }
            });
    });
}

export class SuperdeskReactComponent<IProps = {}, IState = {}> extends React.PureComponent<IProps, IState> {
    private abortControllers: Array<AbortController>;

    /**
     * Will automatically abort in-progress asynchronous operations(only those in asyncHelpers) when unmounting.
     */
    public asyncHelpers: {
        fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
        httpRequestJsonLocal: <T>(options: Parameters<typeof httpRequestJsonLocal>[0]) => Promise<T>;
    };

    constructor(props: IProps) {
        super(props);

        this.abortControllers = [];

        this.asyncHelpers = {
            fetch: (input: RequestInfo, init?: RequestInit): Promise<Response> => {
                const controller = new AbortController();

                this.abortControllers.push(controller);

                return ignoreAbortError(
                    fetch(input, {...(init ?? {}), signal: controller.signal}),
                );
            },
            httpRequestJsonLocal: (options: Parameters<typeof httpRequestJsonLocal>[0]) => {
                const controller = new AbortController();

                this.abortControllers.push(controller);

                return ignoreAbortError(
                    httpRequestJsonLocal({...options, abortSignal: controller.signal}),
                );
            },
        };

        // Save before overwriting.
        const componentWillUnmountChild = this.componentWillUnmount?.bind(this) ?? noop;

        this.componentWillUnmount = () => {
            this.abortControllers.forEach((controller) => {
                controller.abort();
            });

            componentWillUnmountChild();
        };
    }
}
