import ng from 'core/services/ng';

function hasPrivilege(privilege: string): boolean {
    const privileges = ng.get('privileges');

    return privileges.userHasPrivileges({[privilege]: 1});
}

export const user = {
    hasPrivilege,
};
