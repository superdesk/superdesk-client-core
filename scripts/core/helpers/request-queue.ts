import {httpRequestJsonLocal} from './network';
import {DEV_TOOLS} from 'core/constants';

export interface IRequestParams {
    method: 'GET' | 'POST';
    endpoint: string;
    data?: any;
    params?: any;
    id?: string;
    abortSignal?: AbortSignal;
}

export enum RequestPriority {
    LOW,
    HIGH,
}

enum RequestStatus {
    PENDING = 'PENDING',
    SENDING = 'SENDING',
    FAILED = 'FAILED',
    DONE = 'DONE',
}

class RequestQueue {
    concurrency = 2;
    queue: Array<Request> = [];
    updateTimeout: number | null = null;

    add(params: IRequestParams, provider: any, priority: RequestPriority = RequestPriority.LOW) {
        const req = new Request(params, provider, priority);
        const prev = this.queue.find((_req) => _req.isEqual(req) && !_req.isFinished());

        if (prev != null) {
            return prev.promise;
        }

        this.enqueue(req);

        return req.promise;
    }

    removeProvider(provider: any) {
        if (provider == null) {
            console.error('provider should be specified when temporary');
            return;
        }

        this.queue = this.queue.filter((req) => {
            if (req.provider === provider) {
                req.reject({remove: 1});
                return false;
            }

            return true;
        });

        this.log('remove provider');
    }

    private update() {
        let req: Request;

        this.log('update');

        while ((req = this.getNextPendingRequest()) != null) {
            this.sendRequest(req);
        }

        this.updateTimeout = null;
    }

    private enqueue(req: Request) {
        let index = 0;

        for (index = 0; index < this.queue.length; index++) {
            const elem = this.queue[index];

            if (elem.priority < req.priority) {
                break;
            }
        }

        this.queue.splice(index, 0, req);
        this.log('enqueue');

        // update queue after current cycle
        // so additional requests added with
        // high priority are processed first
        if (this.updateTimeout == null) {
            this.updateTimeout = window.setTimeout(() => this.update(), 0);
        }
    }

    private getNextPendingRequest() {
        for (let i = 0; i < this.queue.length && i < this.concurrency; i++) {
            const req = this.queue[i];

            if (req.isPending()) {
                return req;
            }
        }
    }

    private sendRequest(req: Request) {
        req.status = RequestStatus.SENDING;
        this.logTime(req, 'start');
        httpRequestJsonLocal({
            method: req.params.method,
            path: req.params.endpoint,
            payload: req.params.data,
            urlParams: req.params.params,
            abortSignal: req.params.abortSignal,
        })
            .then((res) => {
                this.logTime(req, 'done');
                req.status = RequestStatus.DONE;
                req.resolve(res);
            }, (reason) => {
                this.logTime(req, 'fail');
                console.error('error', reason, req);
                req.status = RequestStatus.FAILED;
                req.reject(reason);
            })
            .finally(() => {
                // finished request, we can start next one
                this.remove(req);
                this.update();
            });
    }

    private remove(req: Request) {
        const index = this.queue.indexOf(req);

        if (index === -1) {
            throw new Error('Request is not in queue');
        }

        this.queue.splice(index, 1);
        this.log('remove');
    }

    private log(event: string) {
        if (DEV_TOOLS.networkQueueLoggerEnabled) {
            // eslint-disable-next-line no-console
            console.debug('queue', event, this.queue.length);
        }
    }

    private logTime(req: Request, event: string) {
        if (DEV_TOOLS.networkQueueLoggerEnabled) {
            const time = Date.now() - req.created;

            // eslint-disable-next-line no-console
            console.debug('queue time', event, `${time} ms`);
        }
    }
}

class Request {
    id: string;
    provider: any;
    created: number;
    priority: RequestPriority;
    params: IRequestParams;
    status: RequestStatus;
    promise: Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;

    constructor(params: IRequestParams, provider: any, priority: RequestPriority) {
        this.id = params.id ?? JSON.stringify(params);
        this.provider = provider;
        this.created = Date.now();
        this.priority = priority;
        this.params = params;
        this.status = RequestStatus.PENDING;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    isPending(): boolean {
        return this.status === RequestStatus.PENDING;
    }

    isRunning(): boolean {
        return this.status === RequestStatus.SENDING;
    }

    isFinished(): boolean {
        return this.status === RequestStatus.DONE || this.status === RequestStatus.FAILED;
    }

    isEqual(req: Request): boolean {
        return (
            req.id === this.id &&
            req.provider === this.provider &&
            req.priority === this.priority
        );
    }
}

export const requestQueue = new RequestQueue();
