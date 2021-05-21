import {IUser} from 'superdesk-api';
import SuperdeskDispatcher from '..';
import UserActionTypes from './UserActionTypes';

const Actions = {
    updateUser(data: IUser) {
        SuperdeskDispatcher.dispatch({
            type: UserActionTypes.UPDATE_USERS,
            payload: data,
        });
    },

    initUsers(data: Array<IUser>) {
        SuperdeskDispatcher.dispatch({
            type: UserActionTypes.INIT_USERS,
            payload: data,
        });
    },
};

export default Actions;
