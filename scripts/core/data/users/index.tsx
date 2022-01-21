import {IUser} from 'superdesk-api';
import {IEntityAction} from '..';

export interface IUserState {
    entities: {[id: string]: IUser};
}

interface IInitUserAction {
    type: 'INIT_USERS';
    payload: Array<IUser>;
}

interface IUpdateLastUserActiveAction {
    type: 'UPDATE_USER_LAST_ACTIVE';
    payload: IUser['_id'];
}

export type IUserAction = IInitUserAction | IUpdateLastUserActiveAction | IEntityAction;

const initialState: IUserState = {
    entities: {},
};

export function users(state = initialState, action: IUserAction): IUserState {
    let entities: IUserState['entities'];

    switch (action.type) {
    case 'INIT_USERS': {
        entities = action.payload.reduce((_entities, user) => {
            _entities[user._id] = user;
            return _entities;
        }, {});

        return {...state, entities};
    }

    case 'UPDATE_ENTITY':
        if (action.payload.resource === 'users') {
            entities = {...state.entities};

            entities[action.payload._id] = action.payload.data as IUser;

            return {...state, entities};
        }
        break;

    case 'UPDATE_USER_LAST_ACTIVE':
        entities = {...state.entities};

        entities[action.payload] = {
            ...entities[action.payload],
            last_activity_at: (new Date()).toISOString(),
        };

        return {...state, entities};
    }

    return state;
}
