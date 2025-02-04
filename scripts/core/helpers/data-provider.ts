import {
    IDataProvider,
    IResourceUpdateEvent,
    IWebsocketMessage,
    IRequestFactory,
    IResponseHandler,
    IListenTo,
    IResourceCreatedEvent,
    IResourceDeletedEvent,
    IRestApiResponse,
    IBaseRestApiResponse,
} from 'superdesk-api';

import {debounce, isEqual} from 'lodash';
import {requestQueue, RequestPriority} from './request-queue';
import {addWebsocketEventListener} from 'core/notification/notification';

const isItemEqual = (a: IBaseRestApiResponse, b: IBaseRestApiResponse) => (
    (a._id != null && a._id === b._id && (
        (a._etag != null && a._etag === b._etag) ||
        (a._updated != null && a._updated === b._updated)
    )) || isEqual(a, b)
);

export class DataProvider<T extends IBaseRestApiResponse> implements IDataProvider {
    updateTimeout = 1000;
    requestFactory: IRequestFactory;
    responseHandler: IResponseHandler<T>;
    listenTo: IListenTo;
    listeners: Array<() => void> = [];

    private scheduleUpdate: () => void;
    private cache: IRestApiResponse<T>;

    constructor(requestFactory: IRequestFactory, responseHandler: IResponseHandler<T>, listenTo: IListenTo) {
        this.requestFactory = requestFactory;
        this.responseHandler = responseHandler;
        this.listenTo = listenTo || {};
        this.scheduleUpdate = debounce(() => this.fetch(), this.updateTimeout);

        // init
        this.update().then(() => this.startListeners());
    }

    /**
     * Force update of data provider.
     */
    update() {
        return this.fetch(RequestPriority.HIGH);
    }

    /**
     * Stop auto updating of data provider.
     */
    stop() {
        this.stopListeners();
        requestQueue.removeProvider(this);
    }

    private fetch(priority: RequestPriority = RequestPriority.LOW) {
        const requestParams = this.requestFactory();

        if (requestParams.endpoint[0] !== '/') {
            requestParams.endpoint = '/' + requestParams.endpoint;
        }

        return requestQueue.add(requestParams, this, priority)
            .then((res: IRestApiResponse<T>) => {
                // it's returning list of items, try to look for previous data
                // and in case there were no changes to it avoid calling the handler,
                // otherwise call it but reuse previous items for not updated entities
                if (res._items != null) {
                    let updated = false;
                    const prev = this.cache?._items || [];
                    const next = res._items.map((nextItem, index) => {
                        // shortcut - test same position in the old list
                        if (prev[index] != null && isItemEqual(prev[index], nextItem)) {
                            return prev[index];
                        }

                        // look for it accross all the previous items
                        const prevItem = prev.find((item) => isItemEqual(item, nextItem));

                        if (prevItem != null) {
                            // it's there, but the position changed
                            updated = true;
                            return prevItem;
                        }

                        // it's not there, new item
                        updated = true;

                        return nextItem;
                    });

                    if (updated || prev.length !== next.length) {
                        this.cache = res;
                        this.responseHandler({_items: next, _meta: res._meta, _links: res._links});
                        return;
                    }
                }

                if (this.cache == null || isEqual(this.cache, res) === false) {
                    this.cache = res;
                    this.responseHandler(res);
                }
            });
    }

    private startListeners() {
        this.listeners.push(addWebsocketEventListener(
            'resource:created',
            (event: IWebsocketMessage<IResourceCreatedEvent>) => {
                const specs = this.listenTo[event.extra.resource];

                if (specs === true || specs?.create === true) {
                    this.scheduleUpdate();
                }
            },
        ));

        this.listeners.push(addWebsocketEventListener(
            'resource:updated',
            (event: IWebsocketMessage<IResourceUpdateEvent>) => {
                const specs = this.listenTo[event.extra.resource];

                if (specs == null) {
                    return;
                }

                if (specs === true || specs.update === true ||
                    specs.update.some((field) => event.extra.fields[field] === 1)
                ) {
                    this.scheduleUpdate();
                }
            },
        ));

        this.listeners.push(addWebsocketEventListener(
            'resource:deleted',
            (event: IWebsocketMessage<IResourceDeletedEvent>) => {
                const specs = this.listenTo[event.extra.resource];

                if (specs === true || specs?.delete === true) {
                    this.scheduleUpdate();
                }
            },
        ));
    }

    private stopListeners() {
        this.listeners.forEach((removeListener) => removeListener());
    }
}
