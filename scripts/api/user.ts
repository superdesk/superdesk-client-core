import ng from 'core/services/ng';
import {IUser} from 'superdesk-api';
import {OrderedMap} from 'immutable';
import {uuid} from 'core/helpers/uuid';

function hasPrivilege(privilege: string): boolean {
    const privileges = ng.get('privileges');

    return privileges.userHasPrivileges({[privilege]: 1});
}

function getCurrentUserId(): string {
    const session = ng.get('session');

    return session?.identity?._id;
}

function isLoggedIn() {
    const session = ng.get('session');

    return session?.identity?._id != null;
}

function getAll(): OrderedMap<IUser['_id'], IUser> {
    return OrderedMap(ng.get('desks').users._items.map((user) => [user._id, user]));
}

function getUniqueClientId(): string {
    let clientId: string | null = sessionStorage.getItem('clientId');

    if (clientId == null) {
        clientId = uuid();
        sessionStorage.setItem('clientId', clientId);
    }

    return clientId;
}

export const user = {
    hasPrivilege,
    isLoggedIn,
    getCurrentUserId,
    getAll,
    getUniqueClientId,
};
