/**
 * @ngdoc service
 * @module superdesk.apps.authoring
 * @name authoringWorkspace
 *
 * @requires $location
 * @requires superdeskFlags
 * @requires authoring
 * @requires lock
 * @requires send
 * @requires config
 * @requires suggest
 * @requires search
 * @requires $rootscope
 *
 * @description Authoring Workspace Service is responsible for the actions done on the authoring workspace container
 */
AuthoringWorkspaceService.$inject = ['$location', 'superdeskFlags', 'authoring', 'lock', 'send', 'config', 'suggest',
    '$rootScope', 'search', '$window'];
export function AuthoringWorkspaceService($location, superdeskFlags, authoring, lock, send, config, suggest,
    $rootScope, search, $window) {
    this.item = null;
    this.action = null;
    this.state = null;

    var self = this;

    /**
     * Initiate authoring workspace
     */
    this.init = init;

    /**
     * Open item for editing
     *
     * @param {Object} item
     * @param {string} action
     */
    this.edit = function(item, action) {
        if (item) {
            // disable edit of external ingest sources that are not editable (editFeaturedImage false or not available)
            if (item._type === 'externalsource' && !!_.get(config.features, 'editFeaturedImage') === false) {
                return;
            }
            authoringOpen(item._id, action || 'edit', item._type || null);
        } else {
            self.close();
        }
    };

    // plugin support
    this.authoringTopBarAdditionalButtons = {},
    this.authoringTopBarButtonsToHide = {};

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
        var _open = function(_item) {
            var actions = authoring.itemActions(_item);

            if (actions.edit) {
                this.edit(_item);
            } else {
                this.view(_item);
            }
        }.bind(this);

        // disable open for external ingest sources that are not editable (editFeaturedImage false or not available)
        if (item._type === 'externalsource' && !!_.get(config.features, 'editFeaturedImage') === false) {
            return;
        }

        if (_.includes(['ingest', 'externalsource'], item._type) || item.state === 'ingested') {
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
        if ($rootScope.popup) {
            window.close();
        }

        suggest.setActive(false);
        self.item = null;
        self.action = null;
        if (showMonitoring && superdeskFlags.flags.hideMonitoring) {
            superdeskFlags.flags.hideMonitoring = false;
        }

        saveState();
        sendRowViewEvents();
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
     * Takedown an item
     *
     * @param {Object} item
     */
    this.takedown = function(item) {
        self.edit(item, 'takedown');
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
    this.addAutosave = function() {
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
     * Edit/view item in a new window
     *
     * @param {Object} item
     * @param {string} action
     */
    this.popup = (item, action) => {
        const host = $location.host();
        const port = $location.port();
        const proto = $location.protocol();
        const baseURL = `${proto}://${host}${port !== 80 ? ':' + port : ''}`;

        $window.open(
            `${baseURL}/#/workspace/monitoring?item=${item._id}&action=${action}&popup`,
            item._id
        );
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
     * @ngdoc method
     * @name authoringWorkspace#sendRowViewEvents
     * @private
     * @description If singLine:view preference is set, an item is being previewed, config has narrowView list
     * then, sends rowview event
     */
    function sendRowViewEvents() {
        let evnt = superdeskFlags.flags.authoring ? 'rowview:narrow' : 'rowview:default';

        if (superdeskFlags.flags.previewing && search.singleLine && _.get(config, 'list.narrowView')) {
            $rootScope.$broadcast(evnt);
        }
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
        return authoring.open(itemId, action === 'view', repo, action)
            .then((item) => {
                self.item = item;
                self.action = action !== 'view' && item._editable ? action : 'view';
            })
            .then(() => {
                saveState();
                // closes preview if already opened
                $rootScope.$broadcast('broadcast:preview', {item: null});
            });
    }

    init();
}
