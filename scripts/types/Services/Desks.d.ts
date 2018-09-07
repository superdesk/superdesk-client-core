import {IUser} from 'business-logic/User';
import {IDesk} from 'business-logic/Desk';

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
