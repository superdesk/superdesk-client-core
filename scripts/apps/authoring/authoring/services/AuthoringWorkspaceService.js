AuthoringWorkspaceService.$inject = ['$location', 'superdeskFlags', 'authoring', 'lock', 'send', 'config', 'suggest'];
export function AuthoringWorkspaceService($location, superdeskFlags, authoring, lock, send, config, suggest) {
    this.item = null;
    this.action = null;
    this.state = null;

    var self = this;

    /**
     * Open item for editing
     *
     * @param {Object} item
     * @param {string} action
     */
    this.edit = function(item, action) {
        if (item) {
            // disable edit of external ingest sources that are not editable(fetch not available)
            if (item._type === 'externalsource' && config.features.editFeaturedImage === false) {
                return;
            }
            authoringOpen(item._id, action || 'edit', item._type || null);
        } else {
            self.close();
        }
    };

    /**
     * Open an item in readonly mode without locking it
     *
     * @param {Object} item
     */
    this.view = function(item) {
        self.edit(item, 'view');
    };

    /**
     * Open an item - if possible for edit, otherwise read only
     *
     * @param {Object} item
     */
    this.open = function(item) {
        var _open = function (_item) {
            var actions = authoring.itemActions(_item);
            if (actions.edit) {
                this.edit(_item);
            } else {
                this.view(_item);
            }
        }.bind(this);

        // disable open for external ingest sources that are not editable(fetch not available)
        if (item._type === 'externalsource' && config.features.editFeaturedImage === false) {
            return;
        }

        if (item._type === 'ingest' || item.state === 'ingested') {
            send.one(item).then(_open);
        } else {
            _open(item);
        }
    };

    /**
     * Stop editing.
     *
     * @param {boolean} showMonitoring when true shows the monitoring if monitoring is hidden.
     */
    this.close = function(showMonitoring) {
        suggest.setActive(false);
        self.item = null;
        self.action = null;
        if (showMonitoring && superdeskFlags.flags.hideMonitoring) {
            superdeskFlags.flags.hideMonitoring = false;
        }

        saveState();
    };

    /**
     * Kill an item
     *
     * @param {Object} item
     */
    this.kill = function(item) {
        self.edit(item, 'kill');
    };

    /**
     * Correct an item
     *
     * @param {Object} item
     */
    this.correct = function(item) {
        self.edit(item, 'correct');
    };

    /**
     * Get edited item
     *
     * return {Object}
     */
    this.getItem = function() {
        return self.item;
    };

    /**
     * Get current action
     *
     * @return {string}
     */
    this.getAction = function() {
        return self.action;
    };

    /**
     * Get current state
     *
     * @return {Object}
     */
    this.getState = function() {
        return self.state;
    };

    /**
     * Should be invoked when an item is saved by system without user interaction
     */
    this.addAutosave = function () {
        if (self.item) {
            self.item._autosaved = true;
        }
    };

    /*
     * Updates current item
     */
    this.update = function(item) {
        self.item = item;
    };

    /**
     * Save current item/action state into $location so that it can be
     * used on page reload
     */
    function saveState() {
        $location.search('item', self.item ? self.item._id : null);
        $location.search('action', self.action);
        superdeskFlags.flags.authoring = !!self.item;
        self.state = {item: self.item, action: self.action};
    }

    /**
     * On load try to fetch item set in url
     */
    function init() {
        if ($location.search().item && $location.search().action in self) {
            authoringOpen($location.search().item, $location.search().action);
        }
    }

    /**
     * Fetch item by id and start editing it
     */
    function authoringOpen(itemId, action, repo) {
        return authoring.open(itemId, action === 'view', repo)
            .then(function(item) {
                self.item = item;
                self.action = (action !== 'view' && item._editable) ? action : 'view';
            })
            .then(saveState);
    }

    init();
}
