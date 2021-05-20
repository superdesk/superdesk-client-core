import Immutable from 'immutable';
import {ReduceStore} from 'flux/utils';
import UserActionTypes from './UserActionTypes';
import SuperdeskDispatcher, {IActionPayload} from '.';
import {IUser} from 'superdesk-api';

export type IUserMap = Immutable.Map<IUser['_id'], IUser>;

class UserStore extends ReduceStore<IUserMap, IActionPayload> {
    constructor() {
        super(SuperdeskDispatcher);
    }

    getInitialState() {
        return Immutable.Map<IUser['_id'], IUser>();
    }

    reduce(state, action) {
        switch (action.type) {
        case UserActionTypes.UPDATE_USERS:
            return state.set(action.payload['_id'], action.payload);

        case UserActionTypes.INIT_USERS:
            return action.payload.reduce((nextState, user) => nextState.set(user._id, user), state);
        }

        return state;
    }
}

export default new UserStore();
