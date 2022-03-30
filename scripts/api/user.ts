import ng from 'core/services/ng';

function hasPrivilege(privilege: string): boolean {
    const privileges = ng.get('privileges');

    return privileges.userHasPrivileges({[privilege]: 1});
}

function isLoggedIn() {
    const session = ng.get('session');

    return session?.identity?._id != null;
}

export const user = {
    hasPrivilege,
    isLoggedIn,
};
