import {IUser} from 'superdesk-interfaces/User';
import {IDesk} from 'superdesk-interfaces/Desk';

export interface IDesksService {
    desks: {
        _items: Array<IDesk>;
    };
    users: any;
    stages: any;
    deskLookup: {};
    stageLookup: {};
    userLookup: Dictionary<IUser['_id'], IUser>;
    deskMembers: {};
    deskStages: {};
    loading: any;
    activeDeskId: any;
    activeStageId: any;
    active: {desk: any, stage: any};
}
