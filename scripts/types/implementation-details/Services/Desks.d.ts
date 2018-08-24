import {User, UserId} from '../../business-logic/User';

export interface DesksService {
    desks: any;
    users: any;
    stages: any;
    deskLookup: {};
    stageLookup: {};
    userLookup: {
        [key: string]: User;
    };
    deskMembers: {};
    deskStages: {};
    loading: any;
    activeDeskId: any;
    activeStageId: any;
    active: {desk: any, stage: any};
}
