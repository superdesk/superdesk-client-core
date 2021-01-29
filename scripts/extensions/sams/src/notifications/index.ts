// import {ISuperdesk} from 'superdesk-api';
// import { superdeskApi } from 'apis';

export interface IArticleUpdateEvent {
    user: string;
    items: {[itemId: string]: 1};
    desks: {[itemId: string]: 1};
    stages: {[itemId: string]: 1};
}

  export interface IResourceUpdateEvent {
    fields: {[key: string]: 1};
    resource: string;
    _id: string;
}

export interface IResourceCreatedEvent {
    resource: string;
    _id: string;
}

export interface IResourceDeletedEvent {
    resource: string;
    _id: string;
}

export interface IWebsocketMessage<T> {
    event: string;
    extra: T;
    _created: string;
    _process: string;
}

export interface IPublicWebsocketMessages {
    'sams:asset:lock_asset': IWebsocketMessage<IArticleUpdateEvent>;
    'sams:asset:unlock_asset': IWebsocketMessage<IResourceCreatedEvent>;
    'sams:asset:session_unlock': IWebsocketMessage<IResourceUpdateEvent>;
    'sams:asset:created': IWebsocketMessage<IResourceCreatedEvent>;
    'sams:asset:updated': IWebsocketMessage<IResourceUpdateEvent>;
    'sams:asset:deleted': IWebsocketMessage<IResourceDeletedEvent>;
    'sams:set:created': IWebsocketMessage<IResourceCreatedEvent>;
    'sams:set:updated': IWebsocketMessage<IResourceUpdateEvent>;
    'sams:set:deleted': IWebsocketMessage<IResourceDeletedEvent>;
}
