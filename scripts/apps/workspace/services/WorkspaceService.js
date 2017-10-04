WorkspaceService.$inject = ['api', 'desks', 'session', 'preferencesService', '$q'];
export function WorkspaceService(api, desks, session, preferences, $q) {
    this.active = null;
    this.save = save;
    this.delete = _delete;
    this.setActive = setActiveWorkspace;
    this.setActiveDesk = setActiveDesk;
    this.getActive = getActiveWorkspace;
    this.getActiveId = readActiveWorkspaceId;
    this.readActive = readActiveWorkspace;
    this.queryUserWorkspaces = queryUserWorkspaces;
    this.isCustom = isCustom;
    this.extraItems = [];
    this.registerExtraItem = registerExtraItem;

    var PREFERENCE_KEY = 'workspace:active',
        RESOURCE = 'workspaces',
        self = this;

    function registerExtraItem(item) {
        this.extraItems.push(item);
    }

    function save(workspace, diff) {
        if (diff) {
            return api.save(RESOURCE, workspace, diff).then(updateActive);
        }

        workspace.user = workspace.user || session.identity._id;
        return api.save(RESOURCE, workspace).then(updateActive);
    }

    function _delete(workspace) {
        return api.remove(workspace)
            .then(() => {
                if (!self.active || self.active._id !== workspace._id) {
                    return $q.when();
                }
                return self.queryUserWorkspaces();
            })
            .then((items) => {
                if (items && items.length) {
                    self.setActive(items[0]);
                } else {
                    self.setActive(null);
                }
                self.getActive();
            });
    }

    /**
     * Set active workspace for given desk
     *
     * @param {Object} desk
     * @return {Promise}
     */
    function setActiveDesk(desk) {
        var updates = {};

        updates[PREFERENCE_KEY] = {workspace: desk._id};
        preferences.update(updates, PREFERENCE_KEY);
        return getDeskWorkspace(desk._id).then(updateActive);
    }

    /**
     * Set active workspace
     *
     * @param {Object} workspace
     */
    function setActiveWorkspace(workspace) {
        updateActive(workspace);
        var updates = {};

        updates[PREFERENCE_KEY] = {workspace: workspace ? workspace._id : ''};
        preferences.update(updates, PREFERENCE_KEY);
    }

    /**
     * Set this.active to given workspace
     *
     * @param {Object} workspace
     * @return {object}
     */
    function updateActive(workspace) {
        self.active = workspace || null;
        return workspace;
    }

    /**
     * Returns true if the workspace is custom (not a desk).
     *
     * @return {bool}
     */
    function isCustom() {
        return angular.isDefined(self.workspaceType) && self.workspaceType === 'workspace';
    }

    /**
     * Get active workspace id
     *
     * @return {Promise}
     */
    function getActiveWorkspaceId() {
        return preferences.get(PREFERENCE_KEY).then((prefs) => prefs && prefs.workspace ? prefs.workspace : null);
    }

    /**
     * Get active workspace
     *
     * First it reads preferences to get last workspace id,
     * in case it's not set it opens workspace for active desk.
     *
     * @return {Promise}
     */
    function readActiveWorkspaceId() {
        return desks.initialize()
            .then(getActiveWorkspaceId)
            .then((activeId) => {
                var type = null;
                var id = null;

                if (desks.activeDeskId && desks.deskLookup[desks.activeDeskId]) {
                    type = 'desk';
                    id = desks.activeDeskId;
                } else if (activeId && desks.deskLookup[activeId]) {
                    type = 'desk';
                    id = activeId;
                    desks.setCurrentDeskId(activeId);
                } else if (activeId) {
                    type = 'workspace';
                    id = activeId;
                } else if (desks.getCurrentDeskId()) {
                    type = 'desk';
                    id = desks.getCurrentDeskId();
                }

                self.workspaceType = type;
                return {id: id, type: type};
            });
    }

    /**
     * Read active workspace
     *
     * First it reads preferences to get last workspace id,
     * in case it's not set it opens workspace for active desk.
     *
     * @return {Promise}
     */
    function readActiveWorkspace() {
        return readActiveWorkspaceId()
            .then((activeWorkspace) => {
                if (activeWorkspace.type === 'desk') {
                    return getDeskWorkspace(activeWorkspace.id);
                } else if (activeWorkspace.type === 'workspace') {
                    return findWorkspace(activeWorkspace.id);
                }
            });
    }

    /**
     * Get active workspace
     *
     * First it reads preferences to get last workspace id,
     * in case it's not set it opens workspace for active desk.
     *
     * @return {Promise}
     */
    function getActiveWorkspace() {
        return readActiveWorkspaceId()
            .then((activeWorkspace) => {
                if (activeWorkspace.type === 'desk') {
                    return getDeskWorkspace(activeWorkspace.id);
                } else if (activeWorkspace.type === 'workspace') {
                    return findWorkspace(activeWorkspace.id);
                }

                return createUserWorkspace();
            })
            .then(updateActive);
    }

    /**
     * Find workspace by given id
     *
     * @param {string} workspaceId
     * @return {Promise}
     */
    function findWorkspace(workspaceId) {
        return api.find(RESOURCE, workspaceId);
    }

    /**
     * Get workspace for given desk
     *
     * @param {string} deskId
     * @return {Promise}
     */
    function getDeskWorkspace(deskId) {
        return api.query('workspaces', {where: {desk: deskId}}).then((result) => {
            if (result._items.length === 1) {
                return result._items[0];
            }

            return {desk: deskId, widgets: []};
        });
    }

    /**
     * Create custom workspace for given user using old config
     *
     * @return {object}
     */
    function createUserWorkspace() {
        return {
            user: session.identity._id,
            // [BC] use old user workspace
            widgets: session.identity.workspace ? session.identity.workspace.widgets : []
        };
    }

    /**
     * Get list of user workspaces
     *
     * @return {Promise}
     */
    function queryUserWorkspaces() {
        return session.getIdentity().then((identity) => api.query(RESOURCE, {where: {user: identity._id}}))
            .then((response) => response._items);
    }
}
