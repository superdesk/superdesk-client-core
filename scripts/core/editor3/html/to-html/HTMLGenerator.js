import {BlockEntityWrapper} from '.';
import {BlockInlineStyleWrapper} from '.';
import {AtomicBlockParser} from '.';

/**
 * @type {Object}
 * @name BlockStyleTags
 * @description Links DraftJS block style values to their correspondent tags. These
 * are the supported block styling options.
 */
const BlockStyleTags = {
    'header-one': 'h1',
    'header-two': 'h2',
    'header-three': 'h3',
    'header-four': 'h4',
    'header-five': 'h5',
    'header-six': 'h6',
    blockquote: 'quote'
};

/**
 * @ngdoc class
 * @name HTMLGenerator
 * @description HTMLGenerator generates HTML from a DraftJS ContentState.
 * @param {Object} contentState
 * @param {Array=} disabled A set of disabled elements (ie. ['table'] will ignore
 * tables.
 */
export class HTMLGenerator {
    constructor(contentState, disabled = []) {
        this.contentState = contentState;
        this.disabled = disabled;
        this.atomicBlockParser = new AtomicBlockParser(contentState, disabled);

        this.convertBlock = this.convertBlock.bind(this);
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#convertBlock
     * @param {Object} contentBlock
     * @returns {string} HTML
     * @description convertBlock takes a contentBlock and converts it to HTML.
     */
    convertBlock(contentBlock) {
        const type = contentBlock.getType();

        if (type === 'atomic') {
            return this.atomicBlockParser.parse(contentBlock);
        }

        const text = contentBlock.getText();
        const styleWrapper = new BlockInlineStyleWrapper();
        const entityWrapper = new BlockEntityWrapper(this.contentState);

        let html = contentBlock.getCharacterList()
            .map((charMeta, key) => {
                const entityTags = entityWrapper.tags(charMeta.getEntity());
                const styleTags = styleWrapper.tags(charMeta.getStyle());

                return styleTags + entityTags + text[key];
            })
            .join('');

        // apply left-over close tags
        html += entityWrapper.flush();
        html += styleWrapper.flush();

        const blockTag = BlockStyleTags[type] || 'p';

        return `<${blockTag}>${html}</${blockTag}>`;
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#html
     * @returns {string} HTML
     * @description Returns the HTML representation of the contentState stored by
     * this instance.
     */
    html() {
        return this.contentState
            .getBlockMap()
            .map(this.convertBlock)
            .join('');
    }
}
