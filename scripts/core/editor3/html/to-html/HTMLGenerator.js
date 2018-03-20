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
    blockquote: 'quote',
    'unordered-list-item': 'li',
    'ordered-list-item': 'li'
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
    constructor(contentState, logger, disabled = []) {
        this.contentState = contentState;
        this.listTags = [];
        this.lastDepth = 0;
        this.atomicBlockParser = new AtomicBlockParser(contentState, logger, disabled);
        this.blocks = contentState.getBlocksAsArray();

        this.convertBlock = this.convertBlock.bind(this);
        this.getBlockTags = this.getBlockTags.bind(this);
        this.listTag = this.listTag.bind(this);
    }

    /**
     * @ngdoc method
     * @param {string} type Block style.
     * @returns {string|undefined} List tag name or undefined.
     * @description If the type is a list type, it returns the wrapping
     * tag, otherwise returns undefined.
     */
    listTag(type) {
        return {
            'unordered-list-item': 'ul',
            'ordered-list-item': 'ol'
        }[type];
    }

    /**
     * @ngdoc method
     * @param {string} type Block type.
     * @param {Number} depth Block depth (lists only).
     * @param {ContentBlock} nextBlock The next block after this one.
     * @returns {Object} Contains two key for tags that come 'before' and 'after' this block.
     * @description Gets the before and after tags for a block, given its type, depth
     * and successor.
     */
    // eslint-disable-next-line complexity
    getBlockTags(type, depth, nextBlock) {
        const {lastDepth} = this;

        let before = '';
        let after = '';

        let listTag = this.listTag(type);

        if (listTag) {
            if (depth < lastDepth) {
                for (let i = 0; i < lastDepth - depth; i++) {
                    before += `</li></${this.listTags.pop()}>`;
                }

                if (lastDepth - depth > 0) {
                    before += '</li>';
                }
            }

            if (depth > lastDepth || this.listTags.length === 0) {
                before += `<${listTag}>`;
                this.listTags.push(listTag);
            }
        } else {
            before += this.flushListTags();
        }

        const tag = BlockStyleTags[type] || 'p';

        before += `<${tag}>`;

        if (!listTag || nextBlock && nextBlock.getDepth() === depth && nextBlock.getType() === type) {
            after += `</${tag}>`;
        }

        if (typeof nextBlock === 'undefined' && listTag) {
            after += this.flushListTags();
        }

        return {before, after};
    }

    /**
     * @ngdoc method
     * @returns {string} Flushed tags. HTML.
     * @description Returns all the unclosed list tags.
     */
    flushListTags() {
        let tags = '';

        while (this.listTags.length > 0) {
            tags += `</li></${this.listTags.pop()}>`;
        }

        return tags;
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#isAnnotationStart
     * @param {Array} annotations
     * @param {Number} key
     * @returns {Bool}
     * @description Returns true if an annotation started at the current text index.
     */
    isAnnotationStart(annotations, key) {
        if (annotations.length == 0) {
            return false;
        }
        return annotations[0].offset == key;
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#isAnnotationEnd
     * @param {Object} annotation
     * @param {Number} key
     * @returns {Bool}
     * @description Returns true if an annotation ended at the current text index.
     */
    isAnnotationEnd(annotation, key) {
        if (!annotation) {
            return false;
        }
        return (annotation.offset + annotation.length - 1) === key;
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#getAnnotations
     * @param {Object} contentBlock
     * @returns {Array} annotations
     * @description Returns an array of annotations sorted by offset.
     */
    getAnnotations(contentBlock) {
        let ranges = contentBlock.getData().get('inlineStyleRanges');

        if (!ranges) {
            return [];
        }
        let annotations = _.filter(ranges, (range) => range.style && range.style.startsWith('ANNOTATION'));

        return annotations.sort((a, b) => {
            if (a.offset < b.offset) {
                return -1;
            }
            if (a.offset == b.offset) {
                return 0;
            }
            return 1;
        });
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#getAnnotationStart
     * @param {Object} annotation
     * @param {Object} contentBlock
     * @returns {String}
     * @description Returns a string containing the HTML inserted before the annotated text.
     */
    getAnnotationStart(annotation, contentBlock) {
        return '<span class="annotation-tag">';
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#getAnnotationEnd
     * @param {Object} annotation
     * @param {Object} contentBlock
     * @returns {String}
     * @description Returns a string containing the HTML inserted after the annotated text.
     */
    getAnnotationEnd(annotation, contentBlock) {
        let data = contentBlock.getData().get('MULTIPLE_HIGHLIGHTS').highlightsData;

        try {
            let annotationData = data[annotation.style];
            let message = JSON.parse(annotationData.data.msg);

            return '</span><span class="annotation-toggle-icon"></span>' +
                '<p class="annotation-content">' + message.blocks[0].text + '</p>';
        } catch (e) {
            return '';
        }
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#convertBlock
     * @param {Object} contentBlock
     * @param {string} id ID of current block
     * @returns {string} HTML
     * @description convertBlock takes a contentBlock and converts it to HTML.
     */
    convertBlock(contentBlock, id) {
        const type = contentBlock.getType();

        if (type === 'atomic') {
            return this.atomicBlockParser.parse(contentBlock);
        }

        const text = contentBlock.getText();
        const styleWrapper = new BlockInlineStyleWrapper();
        const entityWrapper = new BlockEntityWrapper(this.contentState);

        let html = '';
        let annotations = this.getAnnotations(contentBlock);
        let annotation = null;

        contentBlock.getCharacterList()
            .forEach((charMeta, key) => {
                const entityTags = entityWrapper.tags(charMeta.getEntity());
                const styleTags = styleWrapper.tags(charMeta.getStyle());

                if (!annotation && this.isAnnotationStart(annotations, key)) {
                    annotation = annotations.shift();
                    html += this.getAnnotationStart(annotation, contentBlock);
                }

                html += styleTags + entityTags + text[key];

                if (annotation && this.isAnnotationEnd(annotation, key)) {
                    html += this.getAnnotationEnd(annotation, contentBlock);
                    annotation = null;
                }
            });
        // apply left-over close tags
        html += entityWrapper.flush();
        html += styleWrapper.flush();

        if (annotation) {
            html += this.getAnnotationEnd(annotation);
        }

        // get block wrapping tags (depth for lists)
        const depth = contentBlock.getDepth();
        const nextBlock = this.blocks[id + 1];

        let {before, after} = this.getBlockTags(type, depth, nextBlock);

        this.lastDepth = depth;

        if (before === '<p>' && html === '' && after === '</p>') {
            return '';
        }

        return `${before}${html}${after}`;
    }

    /**
     * @ngdoc method
     * @name HTMLGenerator#html
     * @returns {string} HTML
     * @description Returns the HTML representation of the contentState stored by
     * this instance.
     */
    html() {
        return this.blocks.reduce((html, block, id) => html + this.convertBlock(block, id), '');
    }
}
