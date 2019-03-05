import _ from 'lodash';

/**
 * @ngdoc service
 * @module superdesk.apps.authoring.compare_versions
 * @name compareVersions
 * @requires superdesk
 * @requires authoringWorkspace
 * @requires referrer
 * @requires $location
 * @description CompareVersionsService maintains all versions and selected versions of currently
 * opened article and manages the compare-versions screen to display the selected versions.
 * Compare versions screen has its boards and displays at least 2 of them.
 * Every board can be popuplated with one version of opened item.
 */
const MIN_BOARDS = 2; // at least two boards to display for versions comparision.

export default class CompareVersionsService {
    constructor(superdesk, authoringWorkspace, referrer, desks, archiveService, $location) {
        this.superdesk = superdesk;
        this.authoringWorkspace = authoringWorkspace;
        this.referrer = referrer;
        this.desks = desks;
        this.archiveService = archiveService;
        this.$location = $location;

        /**
         * @ngdoc property
         * @name compareVersions#items
         * @type {Array<object>}
         * @description Maintains array of object that contains selected versions of an opened article
         * for viewing in boards.
         */
        this.items = [];

        /**
         * @ngdoc property
         * @name compareVersions#versions
         * @type {Array<object>}
         * @description Maintains array of object that contains all available versions of an opened article.
         */
        this.versions = [];
    }

    /**
     * @ngdoc method
     * @name compareVersions#minBoards
     * @returns {Integer} - MIN_BOARDS
     * @description returns minimum number of boards (i.e: 2) to display.
     */
    minBoards() {
        return MIN_BOARDS;
    }

    /**
     * @ngdoc method
     * @name compareVersions#create
     * @param {Array<object>} itemVersions - Array of selected versions objects each contains 'id' and 'version'
     * @description maintains array of object that contains all fetched versions of article.
     */
    create(itemVersions) {
        this.items = [];

        if (itemVersions) {
            _.each(itemVersions, (itemVersion) => {
                this.items.push(this._createBoard(itemVersion));
            });
        }
        if (this.items.length < MIN_BOARDS) {
            for (let i = 0; i < MIN_BOARDS - this.items.length; i++) {
                this.items.push(this._createBoard(null));
            }
        }

        this.open();
    }

    /**
     * @ngdoc method
     * @name compareVersions#exit
     * @description closes compare-versions screen and returns to opened article.
     */
    exit() {
        this.$location.url(this.referrer.getReferrerUrl());
        this.authoringWorkspace.init();
    }

    /**
     * @ngdoc method
     * @name compareVersions#open
     * @description opens compare-versions screen to view selected versions.
     */
    open() {
        this.referrer.setReferrerUrl(this.$location.url());
        if (this.authoringWorkspace.getState()) {
            this.authoringWorkspace.close(true);
        }
        this.superdesk.intent('author', 'compare-versions');
    }

    /**
     * @ngdoc method
     * @name compareVersionsn#edit
     * @param {Object} itemVersion - {id: _id, version: _current_version}
     * @param {Integer} board - opened board index
     * @description displays the provided item version to opened board.
     */
    edit(itemVersion, board) {
        if (!this.items[board]) {
            this.items[board] = this._createBoard(itemVersion);
        } else {
            this.items[board].article = itemVersion;
        }
    }

    /**
     * @ngdoc method
     * @name compareVersions#remove
     * @param {Object} itemVersion - {id: _id, version: _current_version}
     * @description removes the item from selected items list.
     */
    remove(itemVersion) {
        _.extend(_.find(this.items, {article: itemVersion}), {article: null});
    }

    /**
     * @ngdoc method
     * @name compareVersions#close
     * @param {Integer} board index
     * @description removes board panel for provided board index.
     */
    close(board) {
        if (this.items.length > MIN_BOARDS) {
            this.items.splice(board, 1);
        }
    }

    /**
     * @ngdoc method
     * @name compareVersions#_createBoard
     * @param {Object} itemVersion - {id: _id, version: _current_version}
     * @private
     * @description Creates board for provided items version.
     */
    _createBoard(itemVersion) {
        return {article: itemVersion};
    }


    init(item) {
        this.desks.initialize()
            .then(() => this.archiveService.getVersions(item, this.desks, 'versions'))
            .then((versions) => {
                this.versions = versions;
                _.each(this.versions, (itemVersion) => {
                    itemVersion.author = this.desks.userLookup[itemVersion.version_creator];
                });

                this.create([{
                    id: item._id,
                    version: item._current_version,
                    author: this.desks.userLookup[item.version_creator],
                }]);
            });
    }
}

CompareVersionsService.$inject = ['superdesk', 'authoringWorkspace', 'referrer',
    'desks', 'archiveService', '$location'];
