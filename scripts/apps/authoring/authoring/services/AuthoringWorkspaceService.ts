import {get, includes} from 'lodash';
import {IArticle} from 'superdesk-api';
import {getCustomEventNamePrefixed} from 'core/notification/notification';

type IAuthoringAction = 'view' | 'edit' | 'kill' | 'takedown' | 'correct';

/**
 * @ngdoc service
 * @module superdesk.apps.authoring
 * @name authoringWorkspace
 *
 * @description Authoring Workspace Service is responsible for the actions done on the authoring workspace container
 */
export class AuthoringWorkspaceService {
    private $location: any;
    private superdeskFlags: any;
    private authoring: any;
    private send: any;
    private config: any;
    private suggest: any;
    private $rootScope: any;
    private search: any;
    private $window: any;

    item: any;
    action: IAuthoringAction;
    state: any;

    widgetVisibilityCheckerFuntions: Array<(arg) => Promise<boolean>>;

    authoringTopBarAdditionalButtons: {};
    authoringTopBarButtonsToHide: {};
    displayAuthoringHeaderCollapedByDefault: any;

    constructor($location, superdeskFlags, authoring, send, config, suggest, $rootScope, search, $window) {
        this.$location = $location;
        this.superdeskFlags = superdeskFlags;
        this.authoring = authoring;
        this.send = send;
        this.config = config;
        this.suggest = suggest;
        this.$rootScope = $rootScope;
        this.search = search;
        this.$window = $window;

        this.item = null;
        this.action = null;
        this.state = null;

        this.widgetVisibilityCheckerFuntions = [];

        // plugin support
        this.authoringTopBarAdditionalButtons = {},
        this.authoringTopBarButtonsToHide = {};
        this.displayAuthoringHeaderCollapedByDefault = null;

        // binding methods
        this.addWidgetVisibilityCheckerFunction = this.addWidgetVisibilityCheckerFunction.bind(this);
        this.removeWidgetVisibilityCheckerFunction = this.removeWidgetVisibilityCheckerFunction.bind(this);
        this.isWidgetVisible = this.isWidgetVisible.bind(this);
        this.init = this.init.bind(this);
        this.authoringOpen = this.authoringOpen.bind(this);
        this.saveState = this.saveState.bind(this);
        this.edit = this.edit.bind(this);
        this.view = this.view.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.kill = this.kill.bind(this);
        this.takedown = this.takedown.bind(this);
        this.correct = this.correct.bind(this);
        this.publish = this.publish.bind(this);
        this.getItem = this.getItem.bind(this);
        this.getAction = this.getAction.bind(this);
        this.getState = this.getState.bind(this);
        this.addAutosave = this.addAutosave.bind(this);
        this.update = this.update.bind(this);
        this.popup = this.popup.bind(this);
        this.sendRowViewEvents = this.sendRowViewEvents.bind(this);

        this.init();
    }

    addWidgetVisibilityCheckerFunction(fn) {
        this.widgetVisibilityCheckerFuntions.push(fn);
    }

    removeWidgetVisibilityCheckerFunction(fn) {
        this.widgetVisibilityCheckerFuntions = this.widgetVisibilityCheckerFuntions.filter((f) => f !== fn);
    }

    isWidgetVisible(widget) {
        return new Promise((resolve) => {
            Promise.all(this.widgetVisibilityCheckerFuntions.map((fn) => fn(widget)))
                .then((res) => {
                    resolve(res.every((i) => i === true));
                });
        });
    }

    /**
     * Open item for editing
     */
    edit(
        item: {_id: IArticle['_id'], _type?: IArticle['_type']},
        action?: IAuthoringAction,
    ) {
        if (item) {
            // disable edit of external ingest sources that are not editable (editFeaturedImage false or not available)
            if (item._type === 'externalsource' && !!get(this.config.features, 'editFeaturedImage') === false) {
                return;
            }
            this.authoringOpen(item._id, action || 'edit', item._type || null);
        } else {
            this.close();
        }
    }

    /**
     * Open an item in readonly mode without locking it
     *
     * @param {Object} item
     */
    view(item) {
        this.edit(item, 'view');
    }

    /**
     * Open an item - if possible for edit, otherwise read only
     *
     * @param {Object} item
     */
    open(item) {
        var _open = (_item) => {
            var actions = this.authoring.itemActions(_item);

            if (actions.edit) {
                this.edit(_item);
            } else {
                this.view(_item);
            }
        };

        // disable open for external ingest sources that are not editable (editFeaturedImage false or not available)
        if (item._type === 'externalsource' && !!get(this.config.features, 'editFeaturedImage') === false) {
            return;
        }

        if (includes(['ingest', 'externalsource'], item._type) || item.state === 'ingested') {
            this.send.one(item).then(_open);
        } else {
            _open(item);
        }
    }

    /**
     * Stop editing.
     *
     * @param {boolean} showMonitoring when true shows the monitoring if monitoring is hidden.
     */
    close(showMonitoring?) {
        if (this.$rootScope.popup) {
            window.close();
        }

        if (this.action === 'edit') {
            window.dispatchEvent(
                new CustomEvent(getCustomEventNamePrefixed('articleEditEnd'), {detail: this.item}),
            );
        }

        this.suggest.setActive(false);
        this.item = null;
        this.action = null;
        if (showMonitoring && this.superdeskFlags.flags.hideMonitoring) {
            this.superdeskFlags.flags.hideMonitoring = false;
        }

        this.saveState();
        this.sendRowViewEvents();
    }

    kill(item) {
        this.edit(item, 'kill');
    }

    takedown(item) {
        this.edit(item, 'takedown');
    }

    correct(item) {
        this.edit(item, 'correct');
    }

    /**
     * Publish again unpublished item
     */
    publish(item) {
        return this.authoring.publish(item.archive_item, {}, 'publish');
    }

    /**
     * Get edited item
     *
     * return {Object}
     */
    getItem() {
        return this.item;
    }

    /**
     * Get current action
     *
     * @return {string}
     */
    getAction() {
        return this.action;
    }

    /**
     * Get current state
     *
     * @return {Object}
     */
    getState() {
        return this.state;
    }

    /**
     * Should be invoked when an item is saved by system without user interaction
     */
    addAutosave() {
        if (this.item) {
            this.item._autosaved = true;
        }
    }

    /*
     * Updates current item
     */
    update(item) {
        this.item = item;
    }

    /**
     * Edit/view item in a new window
     *
     * @param {Object} item
     * @param {string} action
     */
    popup(item, action) {
        const host = this.$location.host();
        const port = this.$location.port();
        const proto = this.$location.protocol();
        const baseURL = `${proto}://${host}${port !== 80 ? ':' + port : ''}`;

        this.$window.open(
            `${baseURL}/#/workspace/monitoring?item=${item._id}&action=${action}&popup`,
            item._id,
        );
    }

    /**
     * Save current item/action state into $location so that it can be
     * used on page reload
     */
    private saveState() {
        this.$location.search('item', this.item ? this.item._id : null);
        this.$location.search('action', this.action);
        this.superdeskFlags.flags.authoring = !!this.item;
        this.state = {item: this.item, action: this.action};
    }

    /**
     * @ngdoc method
     * @name authoringWorkspace#sendRowViewEvents
     * @private
     * @description If singLine:view preference is set, an item is being previewed, config has narrowView list
     * then, sends rowview event
     */
    sendRowViewEvents() {
        let evnt = this.superdeskFlags.flags.authoring ? 'rowview:narrow' : 'rowview:default';

        if (this.superdeskFlags.flags.previewing && this.search.singleLine && get(this.config, 'list.narrowView')) {
            this.$rootScope.$broadcast(evnt);
        }
    }

    /**
     * Initiate authoring workspace; On load try to fetch item set in url
     */
    init() {
        if (this.$location.search().item && this.$location.search().action in this) {
            this.authoringOpen(this.$location.search().item, this.$location.search().action);
        }
    }

    /**
     * Fetch item by id and start editing it
     */
    private authoringOpen(itemId, action: IAuthoringAction, repo?) {
        return this.authoring.open(itemId, action === 'view', repo, action)
            .then((item: IArticle) => {
                if (this.item != null) { // action isn't relevant
                    window.dispatchEvent(
                        new CustomEvent(getCustomEventNamePrefixed('articleEditEnd'), {detail: this.item}),
                    );
                }

                this.item = item;
                this.action = action !== 'view' && item._editable ? action : 'view';

                if (action === 'edit') {
                    window.dispatchEvent(
                        new CustomEvent(getCustomEventNamePrefixed('articleEditStart'), {detail: item}),
                    );
                }

                this.saveState();
                // closes preview if already opened
                this.$rootScope.$broadcast('broadcast:preview', {item: null});
            });
    }
}

AuthoringWorkspaceService.$inject = [
    '$location',
    'superdeskFlags',
    'authoring',
    'send',
    'config',
    'suggest',
    '$rootScope',
    'search',
    '$window',
];
