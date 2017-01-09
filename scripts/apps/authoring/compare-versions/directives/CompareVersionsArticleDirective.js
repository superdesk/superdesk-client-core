class LinkFunction {
    constructor(compareVersions, lock, $timeout, scope, elem) {
        this.compareVersions = compareVersions;
        this.lock = lock;
        this.$timeout = $timeout;
        this.scope = scope;
        this.elem = elem;

        this.init();
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsArticle#init
     * @private
     * @description Initializes the directive with default values for the scope
     * and with necessary watchers.
     */
    init() {
        this.scope.$watch('article', (newVal, oldVal) => {
            if (newVal && newVal !== oldVal) {
                this.openItem();
            }
        });

        this.scope.remove = this.remove.bind(this);

        this.openItem();
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsArticle#remove
     * @description Removes the item from opened board.
     */
    remove(item) {
        this.compareVersions.remove({id: item._id, version: item._current_version});
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsArticle#openItem
     * @private
     * @description Opens the selected article version in sdArticleEdit directive.
     */
    openItem() {
        let item = _.find(this.compareVersions.versions, {_current_version: this.scope.article.version});

        this.scope.origItem = item;
        this.scope.item = _.create(item);
        this.scope._editable = false;
        this.scope.isMediaType = _.includes(['audio', 'video', 'picture', 'graphic'], this.scope.item.type);

        if (this.scope.focus) {
            this.$timeout(() => {
                this.elem.children().focus();
            }, 0, false);
        }

        this.scope.isLocked = this.lock.isLocked(item);
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring.compare_versions
 * @name sdCompareVersionsArticle
 * @requires compareVersions
 * @requires lock
 * @requires $timeout
 * @param {Object} article - current article's version to display on board - {id: _id, version: _current_version}
 * @param {Boolean} focus - determines if focus needs to set on this board.
 * @description Displays the board which contains sdArticleEdit directive to display the contents of the selected
 * version of opened article and provides a remove function to remove the item version from board.
 */
export function CompareVersionsArticleDirective(compareVersions, lock, $timeout) {
    return {
        template: require('scripts/apps/authoring/compare-versions/views/sd-compare-versions-article.html'),
        scope: {article: '=', focus: '='},
        link: (scope, elem) => new LinkFunction(compareVersions, lock, $timeout, scope, elem)
    };
}

CompareVersionsArticleDirective.$inject = ['compareVersions', 'lock', '$timeout'];
