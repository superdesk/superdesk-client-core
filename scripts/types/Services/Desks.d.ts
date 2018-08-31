import {IUser} from 'business-logic/User';

export interface IDesksService {
    desks: any;
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
