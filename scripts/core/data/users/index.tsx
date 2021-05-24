import {IUser} from 'superdesk-api';
import {IEntityAction} from '..';

export interface IUserState {
    entities: {[id: string]: IUser};
}

export type IUserAction = {
    type: 'INIT_USERS';
    payload: Array<IUser>;
} | IEntityAction;

const initialState: IUserState = {
    entities: {},
};

export function users(state = initialState, action: IUserAction): IUserState {
    switch (action.type) {
    case 'INIT_USERS': {
        const entities = action.payload.reduce((_entities, user) => {
            _entities[user._id] = user;
            return _entities;
        }, {});

        return {...state, entities};
    }

    case 'UPDATE_ENTITY':
        if (action.payload.resource === 'users') {
            const entities = {...state.entities};

            entities[action.payload._id] = action.payload.data as IUser;

            return {...state, entities};
        }
    }

    return state;
}
