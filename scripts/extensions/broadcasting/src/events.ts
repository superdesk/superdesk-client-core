import {GenericEvents} from '@superdesk/common';
import {IRundown, IRundownItem} from './interfaces';

export interface IBroadcastingEvents {
    broadcastingPageDidLoad: true;
    openRundownItem: {
        rundownId: IRundown['_id'];
        rundownItemId: IRundownItem['_id'];
        sidePanel?: string;
    };
}

export const events = new GenericEvents<IBroadcastingEvents>('broadcasting');
