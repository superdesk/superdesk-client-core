import SuperdeskDispatcher from '.';
import UserActionTypes from './UserActionTypes';

const Actions = {
    updateUser(data) {
        SuperdeskDispatcher.dispatch({
            type: UserActionTypes.UPDATE_USERS,
            payload: data,
        });
    },

    initUsers(data) {
        SuperdeskDispatcher.dispatch({
            type: UserActionTypes.INIT_USERS,
            payload: data,
        });
    },
};

export default Actions;
