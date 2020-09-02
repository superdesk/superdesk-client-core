import {List, OrderedSet, fromJS} from 'immutable';
import docsSoap from 'docs-soap';

import {
    ContentBlock,
    CharacterMetadata,
    Entity,
    ContentState,
    convertFromHTML,
    convertToRaw,
} from 'draft-js';

/**
 * @ngdoc class
 * @name HTMLParser
 * @description HTMLParser is a class that takes HTML and returns a ContentState. At
 * its simplest form, it uses `convertFromHTML` from draft-js to do this operation.
 *
 * To make it compatible with Editor3, it additionally processes Editor3 atomic blocks,
 * such as tables, images and embeds. To process these blocks, which `convertFromHTML`
 * doesn't do, it simply extracts the nodes from the HTML before processing it, and saves
 * them in a separate structure, replacing the nodes with <figure> tags that contain text
 * indicating in which structure and at which position the information was saved.
 *
 * Afterwards, it traverses the returned blocks, looking for atomic blocks. When an atomic
 * block is found, it reads its text, and if it indicates one of the saved structures along
 * with an ID, it creates the needed block.
 *
 * This "small hack" allows us to use a reliable HTML convertor provided by DraftJS, as
 * well as accommodate Editor3 custom atomic blocks.
 */
class HTMLParser {
    iframes: any;
    scripts: any;
    figures: any;
    tables: any;
    media: any;
    associations: any;
    tree: any;

    constructor(html, associations) {
        this.iframes = {};
        this.scripts = {};
        this.figures = {};
        this.tables = {};
        this.media = {};
        this.associations = associations;

        this.tree = $('<div></div>');

        this.createTree(html);
    }

    /**
     * @name HTMLParser#createTree
     * @description Takes the given HTML, extracts the atomic blocks, and creates
     * the tree to be parsed by the DraftJS's convertor.
     */
    createTree(html: string) {
        const _html = docsSoap.default(html); // Needed for Google docs

        this.tree.html(_html);
        this.pruneNodes();
    }

    manageEmbeds(__html: string): string {
        let html = __html;
        const embedCount = html.match(/<!-- EMBED START.*-->/g)?.length ?? 0;

        for (let i = 0; i < embedCount; i++) {
            const startTag = html.match(/<!-- EMBED START.*-->/);
            const endTag = html.match(/<!-- EMBED END.*-->/);

            if (startTag == null || endTag == null) {
                continue;
            }

            const matchedEmbedText = html.slice(startTag.index, endTag.index + endTag[0].length);
            const associationId = html.match(/<!-- EMBED START (?:Image|Video) {id: "([a-z0-9]*?)"} -->/)?.[1];

            if (associationId != null) {
                const nextIndex = Object.keys(this.media).length;

                html = html.replace(
                    matchedEmbedText,
                    `<figure>BLOCK_MEDIA_${nextIndex}</figure>`,
                );

                this.media[nextIndex] = {
                    media: this.associations[associationId],
                };
            } else {
                const nextIndex = Object.keys(this.figures).length;

                html = html.replace(
                    matchedEmbedText,
                    `<figure>BLOCK_FIGURE_${nextIndex}</figure>`,
                );

                const wrapper = document.createElement('div');

                wrapper.innerHTML = matchedEmbedText.replace(startTag[0], '').replace(endTag[0], '');

                const el = wrapper.firstElementChild;

                this.figures[nextIndex] = el.tagName === 'FIGURE' && wrapper.childElementCount === 1
                    ? el.innerHTML // drop <figure> wrapper
                    : wrapper.innerHTML;
            }
        }

        return html;
    }

    /**
     * @name HTMLParser#pruneNodes
     * @description Replaces the nodes that need to be converted to atomic blocks
     * with <figure> tags containing text indicating the type of block that is needed
     * there, along with an ID. The ID links to a structure that stores information
     * about the HTML that was extracted.
     */
    pruneNodes() {
        this.tree.html(this.manageEmbeds(this.tree.html()));

        this.tree.find('iframe').each((i, node) => {
            this.iframes[i] = node.outerHTML;
            $(node).replaceWith(`<figure>BLOCK_IFRAME_${i}</figure>`);
        });

        this.tree.find('script').each((i, node) => {
            this.scripts[i] = node.outerHTML;
            $(node).replaceWith(`<figure>BLOCK_SCRIPT_${i}</figure>`);
        });

        this.tree.find('figure').each((i, node) => {
            if (node.innerText.startsWith('BLOCK_')) {
                // already handled
                return;
            }

            // assume embed
            this.figures[i] = $(node).html();
            $(node).replaceWith(`<figure>BLOCK_FIGURE_${i}></figure>`);
        });

        this.tree.find('table').each((i, node) => {
            this.tables[i] = $(node).html();
            $(node).replaceWith(`<figure>BLOCK_TABLE_${i}</figure>`);
        });

        this.tree.find('.media-block').each((i, node) => {
            this.media[i] = $(node)[0].outerHTML;
            $(node).replaceWith(`<figure>BLOCK_MEDIA_${i}</figure>`);
        });

        // import external media as embeds
        this.tree.find('img, audio, video').each((i, node) => {
            this.figures[i] = node.outerHTML;
            $(node).replaceWith(`<figure>BLOCK_FIGURE_${i}</figure>`);
        });
    }

    /**
     * @name HTMLParser#contentState
     * @description Returns the full content state corresponding to the HTML that
     * initialized the instance.
     */
    contentState(): ContentState {
        const processBlock = this.processBlock.bind(this);
        const html = this.tree.html();

        if (html.trim() === '') {
            // if html is empty then create an empty content state
            return ContentState.createFromText('');
        }

        const conversionResult = convertFromHTML(html);

        let contentState = ContentState.createFromBlockArray(
            conversionResult.contentBlocks,
            conversionResult.entityMap,
        );

        contentState = this.processLinks(contentState);

        return ContentState.createFromBlockArray(
            contentState.getBlocksAsArray().map(processBlock),
            contentState.getEntityMap(),
        );
    }

    /**
     * Convert link entity data to editor3 format
     */
    processLinks(initialState: ContentState): ContentState {
        let contentState = initialState;

        contentState.getBlocksAsArray().forEach((block) => {
            block.findEntityRanges((characterMetadata) => characterMetadata.getEntity() != null, (start, _end) => {
                const key = block.getEntityAt(start);

                if (key != null) {
                    const entity = contentState.getEntity(key);

                    if (entity['type'] === 'LINK') {
                        const _data = entity.getData();

                        contentState = contentState.replaceEntityData(key, {
                            link: {href: _data.href || _data.url, target: _data.target},
                        });
                    }
                }
            });
        });

        return contentState;
    }

    /**
     * @name HTMLParser#processBlock
     * @description Processes the given block. If it's an atomic block that has text
     * indicating the ID of a pruned node, it returns the new corresponding block.
     */
    processBlock(block: ContentBlock): ContentBlock {
        const isAtomic = block.getType() === 'atomic';
        const isTable = block.getText().startsWith('BLOCK_TABLE_');
        const isMedia = block.getText().startsWith('BLOCK_MEDIA_');
        const isFigure = block.getText().startsWith('BLOCK_FIGURE_');
        const isIframe = block.getText().startsWith('BLOCK_IFRAME_');
        const isScript = block.getText().startsWith('BLOCK_SCRIPT_');

        if (isAtomic) {
            if (isTable) {
                return this.createTableBlock(block);
            }

            if (isMedia) {
                return this.createMediaBlock(block);
            }

            if (isFigure) {
                return this.createFigureBlock(block);
            }

            if (isIframe) {
                return this.createEmbedBlock(block, this.iframes);
            }

            if (isScript) {
                return this.createEmbedBlock(block, this.scripts);
            }
        }

        return block;
    }

    /**
     * Create atomic block for embeds
     */
    createFigureBlock(block: ContentBlock): ContentBlock {
        const id = this.getBlockId(block);

        var htmlElement = document.createElement('div');

        htmlElement.innerHTML = this.figures[id];

        // capturing description from editor2
        const descriptionElement = htmlElement.querySelector('figcaption');
        const descriptionText = descriptionElement != null ? descriptionElement.innerText : '';

        if (descriptionElement != null) {
            descriptionElement.remove();
        }

        return atomicBlock(block, 'EMBED', 'MUTABLE', {
            data: {html: htmlElement.innerHTML},
            description: descriptionText,
        });
    }

    /**
     * Create atomic block for embeds
     */
    createEmbedBlock(block: ContentBlock, items: Array<any>): ContentBlock {
        const id = this.getBlockId(block);

        var htmlElement = document.createElement('div');

        htmlElement.innerHTML = items[id];

        return atomicBlock(block, 'EMBED', 'MUTABLE', {
            data: {html: htmlElement.innerHTML},
        });
    }

    /**
     * @name HTMLParser#createTableBlock
     * @param {ContentBlock} block
     * @description Takes an unprocessed atomic block (that is assumed to be a
     * soon-to-be table block) and processes it.
     * @returns {ContentBlock} The fully restored table block.
     */
    createTableBlock(block: ContentBlock): ContentBlock {
        const id = this.getBlockId(block);
        const tableHTML = this.tables[id];
        const tableNode = $('<table></table>');

        tableNode.html(tableHTML);

        const rows = tableNode.find('tr');
        const numRows = rows.length;
        const numCols = rows.first().find('th,td').length;

        let cells = [];

        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const row = $(rows[i]);
                const col = $(row.find('th,td')[j]);
                const {contentBlocks, entityMap} = convertFromHTML(col.html());
                const cellContentState = ContentState.createFromBlockArray(contentBlocks, entityMap);

                cells[i] = cells[i] || [];
                cells[i][j] = convertToRaw(cellContentState);
            }
        }

        return atomicBlock(block, 'TABLE', 'MUTABLE', {data: {numRows, numCols, cells}});
    }

    /**
     * Get block id from block text
     */
    getBlockId(block: ContentBlock): number {
        return parseInt(block.getText()
            .split('_')
            .pop(),
        10);
    }

    /**
     * @name HTMLParser#createMediaBlock
     * @description Takes an unprocessed atomic block (that is assumed to be a
     * an media block) and processes it.
     */
    createMediaBlock(block: ContentBlock): ContentBlock {
        const id = this.getBlockId(block);
        const mediaJson = this.media[id];

        return atomicBlock(block, 'MEDIA', 'MUTABLE', mediaJson);
    }
}

export function getContentStateFromHtml(html: string, associations: object = null): ContentState {
    return new HTMLParser(html, associations).contentState();
}

/**
 * @name atomicBlock
 * @param {Object} block The block to copy
 * @param {string} entityType
 * @param {string} entityMutability Mutability type (MUTABLE, IMMUTABLE).
 * @param {Object} entityData
 * @description Returns the given block, having its text replaced by one space that
 * has the corresponding character metadata linked to the given entity.
 * @returns {Object} The new atomic block.
 */
function atomicBlock(block, entityType, entityMutability, entityData) {
    // TODO(gbbr): Will not work with DraftJS 0.11
    const entityKey = Entity.create(entityType, entityMutability, entityData);
    const text = ' ';
    const {type, key, depth} = block.toJS();
    const data = fromJS(block.toJS().data);

    const char = CharacterMetadata.create({
        style: OrderedSet([]),
        entity: entityKey,
    });

    const characterList = List([char]);

    return new ContentBlock({type, key, depth, data, text, characterList});
}
