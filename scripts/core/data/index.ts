import {Dispatcher} from 'flux';
import {IResourceUpdateEvent, IWebsocketMessage} from 'superdesk-api';
import {addWebsocketEventListener} from 'core/notification/notification';
import {dataApi} from 'core/helpers/CrudManager';

export interface IActionPayload {
    type: string;
    payload: any;
}

const superdeskDispatcher = new Dispatcher<IActionPayload>();

const RESOURCE_BLACKLIST = [
    'auth',
    'audit',
];

addWebsocketEventListener(
    'resource:updated',
    (event: IWebsocketMessage<IResourceUpdateEvent>) => {
        const {resource, _id} = event.extra;

        if (RESOURCE_BLACKLIST.includes(resource)) {
            return;
        }

        dataApi.findOne(resource, _id).then((updated) => {
            superdeskDispatcher.dispatch({
                type: `UPDATE_${resource.toUpperCase()}`,
                payload: updated,
            });
        }, (reason) => {
            console.error(`got error when fetching ${resource}/${_id}: ${reason}`);
        });
    },
);

export default superdeskDispatcher;
