import {ContentState, convertFromRaw, convertToRaw, ContentBlock} from 'draft-js';
import {isQumuWidget, postProccessQumuEmbed} from '../../components/embeds/QumuWidget';
import {logger} from 'core/services/logger';
import {editor3StateToHtml} from './editor3StateToHtml';
import {getData, IEditor3CustomBlockData, IEditor3TableData} from 'core/editor3/helpers/table';
import {MULTI_LINE_QUOTE_CLASS} from 'core/editor3/components/multi-line-quote/MultiLineQuote';
import {CustomEditor3Entity} from 'core/editor3/constants';
import {IEditorDragDropArticleEmbed} from 'core/editor3/reducers/editor3';
import {assertNever} from 'core/helpers/typescript-helpers';
import {sdApi} from 'api';
import {configurableAlgorithms} from 'core/ui/configurable-algorithms';

/**
 * @ngdoc class
 * @name AtomicBlockParser
 * @description AtomicBlockParser is a helper class for `editor3StateToHtml`. It parses
 * Editor3 atomic blocks (image, table, embed, etc.).
 * @param {Object} contentState
 * @param {Array=} disabled A set of disabled elements (ie. ['table'] will ignore tables.
 */
export class AtomicBlockParser {
    contentState: any;
    disabled: any;
    rawState: any;

    constructor(contentState, disabled = []) {
        this.contentState = contentState;
        this.disabled = disabled;
        this.rawState = convertToRaw(contentState);
    }

    /**
     * @ngdoc method
     * @name AtomicBlockParser#parse
     * @param {Object} contentBlock
     * @returns {string} HTML
     * @description Returns the HTML representation of the passed contentBlock.
     */
    parse(contentBlock: ContentBlock): string | undefined {
        const entityKey = contentBlock.getEntityAt(0);

        if (!entityKey) {
            return;
        }

        const entity = this.contentState.getEntity(entityKey);
        const data = entity.getData();
        const rawKey = this.getRawKey(data);

        const entityType: CustomEditor3Entity = entity.getType();

        switch (entityType) {
        case CustomEditor3Entity.MEDIA:
            return this.parseMedia(data, rawKey).trim();
        case CustomEditor3Entity.EMBED:
            return this.parseEmbed(data).trim();
        case CustomEditor3Entity.TABLE:
            return this.parseTable(getData(this.contentState, contentBlock.getKey())).trim();
        case CustomEditor3Entity.MULTI_LINE_QUOTE:
            return this.parseMultiLineQuote(getData(this.contentState, contentBlock.getKey())).trim();
        case CustomEditor3Entity.CUSTOM_BLOCK:
            return this.parseCustomBlock(getData(this.contentState, contentBlock.getKey())).trim();
        case CustomEditor3Entity.ARTICLE_EMBED:
            // eslint-disable-next-line no-case-declarations
            const item = (data as IEditorDragDropArticleEmbed['data']).item;

            return `<div data-association-key="${item._id}">${item.body_html}</div>`;
        default:
            logger.warn(`Editor3: Cannot generate HTML for entity type of ${entity.getType()}`, data);
            assertNever(entityType);
        }
    }

    /**
     * Get entity key from raw state, which will be sent to backend and which is used for associations
     *
     * @param {Object} data
     * @return Number
     */
    getRawKey(data) {
        return Object.keys(this.rawState.entityMap).find((key) => this.rawState.entityMap[key].data === data);
    }

    /**
     * @ngdoc method
     * @name AtomicBlockParser#parseEmbed
     * @param {Object} data Entity data.
     * @returns {string} HTML
     * @description Returns the HTML representation of an atomic 'EMBED' block having
     * the passed entity data.
     */
    parseEmbed({data, description}) {
        let {html} = data;
        const descriptionHtml = typeof description === 'string' && description.length > 0
            ? `<p class="embed-block__description">${description}</p>`
            : '';
        const finalHtml = isQumuWidget(html) ? postProccessQumuEmbed(html) : data.html;

        return `<div class="embed-block">${finalHtml}${descriptionHtml}</div>`;
    }

    /**
     * @ngdoc method
     * @name AtomicBlockParser#parseMedia
     * @param {Object} data Entity data.
     * @param {String} rawKey Entity output key.
     * @returns {string} HTML
     * @description Returns the HTML representation of an atomic 'MEDIA' block having
     * the passed entity data.
     */
    parseMedia(data, rawKey) {
        const {media} = data;
        const rendition = media.renditions.original || media.renditions.viewImage;
        const href = rendition.href;
        const alt = media.alt_text || '';
        const mediaType = media.type;

        let type, content, desc = media.description_text;

        switch (mediaType) {
        case 'video':
            type = 'Video';
            content = `<video controls src="${href}" alt="${alt}" width="100%" height="100%" />`;
            break;
        case 'audio':
            type = 'Audio';
            content = `<audio controls src="${href}" alt="${alt}" width="100%" height="100%" />`;
            break;
        default:
            type = 'Image';
            content = `<img src="${href}" alt="${alt}" />`;
        }

        return this.formatEmbed(type, rawKey, content, desc);
    }

    formatEmbed(type, key, content, desc) {
        const id = `${type} {id: "editor_${key}"}`;

        if (desc) {
            // eslint-disable-next-line
            content += `\n    <figcaption>${desc}</figcaption>`;
        }

        return `
<!-- EMBED START ${id} -->
<figure>
    ${content}
</figure>
<!-- EMBED END ${id} -->
`;
    }

    /**
     * @ngdoc method
     * @name AtomicBlockParser#parseTable
     * @param {Object} data Entity data.
     * @returns {string} HTML
     * @description Returns the HTML representation of an atomic 'TABLE' block having
     * the passed entity data.
     */
    parseTable(data) {
        if (this.disabled.indexOf('table') > -1) {
            return '';
        }

        const {numRows, numCols, cells, withHeader} = data;
        const getCell = (i, j) => {
            const cellContentState = cells[i] && cells[i][j]
                ? convertFromRaw(cells[i][j])
                : ContentState.createFromText('');

            return editor3StateToHtml(cellContentState, ['table']);
        };

        let html = '<table>';
        let startRow = 0;

        if (withHeader) {
            html += '<thead><tr>';

            for (let j = 0; j < numCols; j++) {
                html += `<th>${getCell(0, j)}</th>`;
            }

            html += '</tr></thead>';
            startRow = 1;
        }

        if (!withHeader || withHeader && numRows > 1) {
            html += '<tbody>';

            for (let i = startRow; i < numRows; i++) {
                html += '<tr>';
                for (let j = 0; j < numCols; j++) {
                    html += `<td>${getCell(i, j)}</td>`;
                }
                html += '</tr>';
            }

            html += '</tbody>';
        }

        html += '</table>';

        return html;
    }

    /**
     * Returns the HTML representation of an atomic
     * @see{CustomEditor3Entity.MULTI_LINE_QUOTE} block having the passed entity data.
     */
    parseMultiLineQuote(data: IEditor3TableData): string {
        if (this.disabled.indexOf('table') > -1) {
            return '';
        }

        const {cells} = data;
        let html = `<div class="${MULTI_LINE_QUOTE_CLASS}">`;
        const cellContentState = cells[0]?.[0] != null
            ? convertFromRaw(cells[0][0])
            : ContentState.createFromText('');

        html += editor3StateToHtml(cellContentState);
        html += '</div>';

        return html;
    }

    parseCustomBlock(data: IEditor3CustomBlockData): string {
        if (this.disabled.indexOf('table') > -1) {
            return '';
        }

        const vocabulary = sdApi.vocabularies.getAll().get(data.vocabularyId);
        const blockId = vocabulary._id;
        const {cells} = data;
        const cellContentState: ContentState = convertFromRaw(cells[0][0]);
        const tableCellContentHtml = editor3StateToHtml(cellContentState);

        if (configurableAlgorithms.editor3?.wrapCustomBlock != null) {
            return configurableAlgorithms.editor3.wrapCustomBlock(vocabulary, tableCellContentHtml);
        } else {
            return `<div data-custom-block-type="${blockId}">${tableCellContentHtml}</div>`;
        }
    }
}
