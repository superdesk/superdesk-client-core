import {User} from '../../business-logic/User';

export interface DesksService {
    desks: any;
    users: any;
    stages: any;
    deskLookup: {};
    stageLookup: {};
    userLookup: Dictionary<User['id'], User>;
    deskMembers: {};
    deskStages: {};
    loading: any;
    activeDeskId: any;
    activeStageId: any;
    active: {desk: any, stage: any};
}
