import {
    IDataProvider,
    IResourceUpdateEvent,
    IWebsocketMessage,
    IRequestFactory,
    IResponseHandler,
    IListenTo,
    IResourceCreatedEvent,
    IResourceDeletedEvent,
} from 'superdesk-api';

import {debounce} from 'lodash';
import {requestQueue, RequestPriority} from './request-queue';
import {addWebsocketEventListener} from 'core/notification/notification';

export class DataProvider implements IDataProvider {
    updateTimeout = 1000;
    requestFactory: IRequestFactory;
    responseHandler: IResponseHandler;
    listenTo: IListenTo;
    listeners: Array<() => void> = [];

    private scheduleUpdate: () => void;

    constructor(requestFactory: IRequestFactory, responseHandler: IResponseHandler, listenTo: IListenTo) {
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

        return requestQueue.add(requestParams, this, priority).then(this.responseHandler);
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
