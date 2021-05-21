import {IUser} from 'superdesk-api';
import {IAction} from '..';
import UserActionTypes from './UserActionTypes';

interface IUserState {
    entities: {[id: string]: IUser};
}

const initialState: IUserState = {
    entities: {},
};

export default function(state = initialState, action: IAction): IUserState {
    switch (action.type) {
    case UserActionTypes.INIT_USERS: {
        const entities = action.payload.reduce((_entities, user) => {
            _entities[user._id] = user;
            return _entities;
        }, {});

        return {...state, entities};
    }

    case UserActionTypes.UPDATE_USERS: {
        const entities = {...state.entities};

        entities[action.payload._id] = action.payload;

        return {...state, entities};
    }

    default:
        return state;
    }
}
