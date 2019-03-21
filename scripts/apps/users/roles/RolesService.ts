export default class RolesService {
    _api: any;

    constructor(api) {
        this._api = api;
    }

    /**
     * Get user role
     *
     * @param {string} roleId
     */
    getUserRole(roleId) {
        return this._api.find('roles', roleId);
    }
}

RolesService.$inject = ['api'];
