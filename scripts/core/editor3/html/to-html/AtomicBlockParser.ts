import {ContentState, convertFromRaw, convertToRaw, ContentBlock} from 'draft-js';
import {isQumuWidget, postProccessQumuEmbed} from '../../components/embeds/QumuWidget';
import {logger} from 'core/services/logger';
import * as tableHelpers from 'core/editor3/helpers/table';
import {editor3StateToHtml} from './editor3StateToHtml';

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

        switch (entity.getType()) {
        case 'MEDIA':
            return this.parseMedia(data, rawKey).trim();
        case 'EMBED':
            return this.parseEmbed(data).trim();
        case 'TABLE':
            return this.parseTable(tableHelpers.getData(this.contentState, contentBlock.getKey())).trim();
        default:
            logger.warn(`Editor3: Cannot generate HTML for entity type of ${entity.getType()}`, data);
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
            ? `<p>${description}</p>`
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
            content += `\n    <figcatpion>${desc}</figcaption>`;
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
}
