import {ContentState, convertFromRaw} from 'draft-js';
import {HTMLGenerator} from '.';
import {isQumuWidget, postProccessQumuEmbed} from '../../components/embeds/QumuWidget';

/**
 * @ngdoc class
 * @name AtomicBlockParser
 * @description AtomicBlockParser is a helper class for the HTMLGenerator. It parses
 * Editor3 atomic blocks (image, table, embed, etc.).
 * @param {Object} contentState
 * @param {Array=} disabled A set of disabled elements (ie. ['table'] will ignore tables.
 */
export class AtomicBlockParser {
    constructor(contentState, logger, disabled = []) {
        this.contentState = contentState;
        this.disabled = disabled;
        this.logger = logger;
    }

    /**
     * @ngdoc method
     * @name AtomicBlockParser#parse
     * @param {Object} contentBlock
     * @returns {string} HTML
     * @description Returns the HTML representation of the passed contentBlock.
     */
    parse(contentBlock) {
        const entityKey = contentBlock.getEntityAt(0);

        if (!entityKey) {
            return;
        }

        const entity = this.contentState.getEntity(entityKey);
        const data = entity.getData();

        switch (entity.getType()) {
        case 'MEDIA':
            return this.parseMedia(data);
        case 'EMBED':
            return this.parseEmbed(data);
        case 'TABLE':
            return this.parseTable(data);
        default:
            this.logger.logWarning(`Editor3: Cannot generate HTML for entity type of ${entity.getType()}`, data);
            return '';
        }
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
     * @returns {string} HTML
     * @description Returns the HTML representation of an atomic 'MEDIA' block having
     * the passed entity data.
     */
    parseMedia(data) {
        const {media} = data;
        const rendition = media.renditions.original || media.renditions.viewImage;
        const href = rendition.href;
        const alt = media.alt_text || '';
        const mediaType = media.type;

        let html = '<div class="media-block">';

        switch (mediaType) {
        case 'video':
            html += `<video controls src="${href}" alt="${alt}" width="100%" height="100%" />`;
            break;
        case 'audio':
            html += `<audio controls src="${href}" alt="${alt}" width="100%" height="100%" />`;
            break;
        default:
            html += `<img src="${href}" alt="${alt}" />`;
        }

        html += media.description_text
            ? `<span class="media-block__description">${media.description_text}</span>`
            : '';

        return `${html}</div>`;
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

        const {numRows, numCols, cells, withHeader} = data.data;
        const getCell = (i, j) => {
            const cellContentState = cells[i] && cells[i][j]
                ? convertFromRaw(cells[i][j])
                : ContentState.createFromText('');

            return new HTMLGenerator(cellContentState, this.logger, ['table']).html();
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
