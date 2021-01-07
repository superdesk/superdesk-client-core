import React from 'react';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {noop} from 'lodash';

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

                // wrapping in another promise in order to handle AbortError in this component.
                return new Promise((resolve, reject) => {
                    fetch(input, {...(init ?? {}), signal: controller.signal})
                        .then(resolve)
                        .catch((err) => {
                            if (err?.name !== 'AbortError') { // ignore AbortError
                                reject(err);
                            }
                        });
                });
            },
            httpRequestJsonLocal: (options: Parameters<typeof httpRequestJsonLocal>[0]) => {
                const controller = new AbortController();

                this.abortControllers.push(controller);

                return new Promise((resolve, reject) => {
                    httpRequestJsonLocal({...options, abortSignal: controller.signal})
                        .then(resolve)
                        .catch((err) => {
                            if (err?.name !== 'AbortError') { // ignore AbortError
                                reject(err);
                            }
                        });
                });
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
