import DiffMatchPatch from 'diff-match-patch';
import shortid from 'shortid';
import _ from 'lodash';

class LinkFunction {
    compareVersions: any;
    content: any;
    lock: any;
    $timeout: any;
    scope: any;
    elem: any;
    diffMatchPatch: any;

    constructor(compareVersions, content, lock, $timeout, scope, elem) {
        this.compareVersions = compareVersions;
        this.content = content;
        this.lock = lock;
        this.$timeout = $timeout;
        this.scope = scope;
        this.elem = elem;

        this.diffMatchPatch = new DiffMatchPatch();

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
        this.scope.$watch('[article, compareWith]', (newVal, oldVal) => {
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
        this.scope.item = _.cloneDeep(item);
        this.scope.compareView = true;
        this.scope._editable = false;
        this.scope.isMediaType = _.includes(['audio', 'video', 'picture', 'graphic'], this.scope.item.type);

        if (this.scope.compareWith && this.scope.article !== this.scope.compareWith) {
            let compareWithItem = _.find(this.compareVersions.versions,
                {_current_version: this.scope.compareWith.version});

            this.scope.compareWithItem = _.create(compareWithItem);
            this.setVersionsDifference(this.scope.item, this.scope.compareWithItem);
        }

        if (this.scope.focus) {
            this.$timeout(() => {
                this.elem.children().focus();
            }, 0, false);
        }

        this.scope.isLocked = this.lock.isLocked(item);
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsArticle#setVersionsDifference
     * @param {Object} item - current item version
     * @param {Object} oldItem - old item to compare with
     * @description Changes 'headline', 'abstract', 'body_footer', 'body_html', 'byline' from item
     * in order to highlight the differences from oldItem
     */
    setVersionsDifference(item, oldItem) {
        this.content.getCustomFields().then((customFields) => {
            const fields = ['headline', 'abstract', 'body_footer', 'body_html', 'byline'];

            _.map(fields, (field) => {
                if (item[field] || oldItem[field]) {
                    item[field] = this.highlightDifferences(item[field], oldItem[field]);
                }
            });

            if (item.extra) {
                _.map(customFields, (field) => {
                    if (item.extra[field._id] || oldItem.extra[field._id]) {
                        item.extra[field._id] = this.highlightDifferences(
                            item.extra[field._id],
                            oldItem.extra[field._id],
                        );
                    }
                });
            }

            if (item.associations && item.associations.featuremedia &&
                oldItem.associations && oldItem.associations.featuremedia) {
                item.associations.featuremedia.description_text = this.highlightDifferences(
                    item.associations.featuremedia.description_text,
                    oldItem.associations.featuremedia.description_text,
                );
            }
        });
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsArticle#highlightDifferences
     * @param {String} newText - current text
     * @param {String} oldText - old text to compare with
     * @description Highlight the differences between new text and old text
     */
    highlightDifferences(newText, oldText) {
        let mapWords = {};
        let pOldText = this.extractHtml(oldText, mapWords);
        let pNewText = this.extractHtml(newText, mapWords);
        let diffs = this.diffMatchPatch.diff_main(pOldText, pNewText);

        this.diffMatchPatch.diff_cleanupSemantic(diffs);
        diffs = this.splitByTranslationOfTags(diffs, this.reverseMap(mapWords, false));

        let text = this.diffMatchPatch
            .diff_prettyHtml(diffs);

        text = this.replaceWords(text, this.reverseMap(mapWords, true));
        return text;
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsArticle#extractHtml
     * @param {String} text - html text
     * @param {Map} mapWords - translation for words
     * @description Replace all html tags with custom tags.
     */
    extractHtml(text, mapWords) {
        let tags = (text || '').match(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g);

        _.map(tags, (tag) => {
            if (!mapWords[tag]) {
                mapWords[tag] = shortid.generate();
            }
        });

        return this.replaceWords(text, mapWords);
    }

    /**
     * @ngdoc replaceWords
     * @name sdCompareVersionsArticle#replaceWords
     * @param {String} text - text
     * @param {Map} mapWords - translation for words
     * @description Replace in text the words from mapWords with corespondent translation
     */
    replaceWords(text, mapWords) {
        let result = text || '';

        result = result.replace(/\n/g, '');

        _.map(Object.keys(mapWords), (key) => {
            result = result.replace(
                new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                ' ' + mapWords[key] + ' ',
            );
        });

        return result;
    }

    /**
     * @ngdoc reverseMap
     * @name sdCompareVersionsArticle#reverseMap
     * @param {Map} mapWords
     * @description Reverse the key with content on mapWords
     */
    reverseMap(mapWords, addSpan) {
        let reversedMap = {};
        let before = addSpan ? '<span>' : '';
        let after = addSpan ? '</span>' : '';

        _.map(Object.keys(mapWords), (key) => {
            reversedMap[before + mapWords[key] + after] = key;
        });

        return reversedMap;
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsArticle#splitByTranslationOfTags
     * @param {Object} diffs - current diffs
     * @description If one item in diffs contain a translation of html tag, split
     * item by translation and put it as a nonchanged item.
     */
    splitByTranslationOfTags(diffs, mapWords) {
        let result = [];

        _.map(diffs, (diff) => {
            var list = diff[1].split(' ');
            let first = true;
            let text = '';

            _.map(list, (item) => {
                if (!first) {
                    text = text + ' ';
                }
                first = false;

                if (mapWords[item]) {
                    result.push([diff[0], text]);
                    result.push([0, item]);
                    text = '';
                } else {
                    text = text + item;
                }
            });
            if (text) {
                result.push([diff[0], text]);
            }
        });

        return result;
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring.compare_versions
 * @name sdCompareVersionsArticle
 * @requires compareVersions
 * @requires content
 * @requires lock
 * @requires $timeout
 * @param {Object} article - current article's version to display on board - {id: _id, version: _current_version}
 * @param {Boolean} focus - determines if focus needs to set on this board.
 * @description Displays the board which contains sdArticleEdit directive to display the contents of the selected
 * version of opened article and provides a remove function to remove the item version from board.
 */
export function CompareVersionsArticleDirective(compareVersions, content, lock, $timeout) {
    return {
        template: require('scripts/apps/authoring/compare-versions/views/sd-compare-versions-article.html'),
        scope: {article: '=', compareWith: '=', focus: '='},
        link: (scope, elem) => new LinkFunction(compareVersions, content, lock, $timeout, scope, elem),
    };
}

CompareVersionsArticleDirective.$inject = ['compareVersions', 'content', 'lock', '$timeout'];
