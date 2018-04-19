/**
 * @type {Object}
 * @name InlineStyleTags
 * @description Links DraftJS style values to tags. These are the supported inline
 * styling options.
 */
const InlineStyleTags = {
    BOLD: 'b',
    ITALIC: 'i',
    UNDERLINE: 'u',
};

/**
 * @ngdoc class
 * @name BlockInlineStyleWrapper
 * @description This class is used as a helper for converting a DraftJS ContentBlock
 * to HTML.
 *
 * BlockInlineStyleWrapper must be instantiated for each block and the `tags` method
 * must be called for each character in that block. The return value of this method
 * will be a string consisting of the appropriate tags needed to preceed the next
 * character. See the tags method for additional information.
 */
export class BlockInlineStyleWrapper {
    constructor(customInlineStyleTags) {
        this.activeStyles = [];
        this.inlineStyleTags = Object.assign({}, InlineStyleTags, customInlineStyleTags);
    }

    getTag(style, type) {
        let tag = this.inlineStyleTags[style];
        let closingChar = type === 'close' ? '/' : '';

        if (tag !== null && typeof tag === 'object') {
            if (type === 'open' && _.has(tag, 'openTag')) {
                return tag.openTag(style);
            }
            if (type === 'close' && _.has(tag, 'closeTag')) {
                return tag.closeTag(style);
            }
            return '';
        }
        return `<${closingChar}${tag}>`;
    }

    /**
     * @ngdoc method
     * @name BlockInlineStyleWrapper#openingTags
     * @param {OrderedSet} styles Immutable's Ordered Set (DraftInlineStyle)
     * @description Checks the given styles set to see if any of them are new and
     * returns the appropriate opening tags.
     * @returns {string} HTML
     */
    openingTags(styles) {
        if (styles.size === 0) {
            return '';
        }

        return styles.map((style) => {
            const tag = this.getTag(style, 'open');
            const alreadyApplied = this.activeStyles.indexOf(style) > -1;

            if (tag && !alreadyApplied) {
                this.activeStyles.push(style);
                return tag;
            }

            return '';
        }).join('');
    }

    /**
     * @ngdoc method
     * @name BlockInlineStyleWrapper#closingTags
     * @param {OrderedSet} styles Immutable's Ordered Set (DraftInlineStyle)
     * @description Checks the given styles set to see if any of them are no longer
     * applied, returning the necessary closing tags.
     * @returns {string} HTML
     */
    closingTags(styles) {
        if (this.activeStyles.length === 0) {
            return '';
        }

        const noLongerApplied = this.activeStyles
            .filter((s) => styles.toArray().indexOf(s) === -1);

        return noLongerApplied.map((style) => {
            const tag = this.getTag(style, 'close');
            const index = this.activeStyles.indexOf(style);

            this.activeStyles.splice(index, 1);

            return tag;
        }).join('');
    }

    /**
     * @ngdoc method
     * @name BlockInlineStyleWrapper#flush
     * @description Returns any remaining closing tag(s).
     * @returns {string} HTML
     */
    flush() {
        let tags = '';

        while (this.activeStyles.length > 0) {
            const style = this.activeStyles.pop();
            const tag = this.getTag(style, 'close');

            tags += tag;
        }

        return tags;
    }

    /**
     * @ngdoc method
     * @name BlockInlineStyleWrapper#tags
     * @param {OrderedSet} styles Immutable's Ordered Set (DraftInlineStyle)
     * @returns {string} HTML
     * @description Returns the appropriate HTML tag(s) needed to preceed the next
     * character which has the set of passed styles. This method must be
     * called for each character in the block if it is to work correctly.
     */
    tags(styles) {
        return this.closingTags(styles) + this.openingTags(styles);
    }
}
