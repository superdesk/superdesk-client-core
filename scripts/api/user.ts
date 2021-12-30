import ng from 'core/services/ng';
import {IUser} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';

function hasPrivilege(privilege: string): boolean {
    const privileges = ng.get('privileges');

    return privileges.userHasPrivileges({[privilege]: 1});
}

function fetchUser(userId: IUser['_id']): Promise<IUser> {
    return httpRequestJsonLocal<IUser>({
        method: 'GET',
        path: `/users/${userId}`,
    });
}

export const user = {
    hasPrivilege,
    fetch: fetchUser,
};
