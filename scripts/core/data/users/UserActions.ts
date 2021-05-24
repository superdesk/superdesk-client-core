import {IUser} from 'superdesk-api';
import {store} from '..';

export const UserActions = {
    initUsers(data: Array<IUser>) {
        store.dispatch({
            type: 'INIT_USERS',
            payload: data,
        });
    },
};
