import {ContentState, convertFromRaw} from 'draft-js';
import {HTMLGenerator} from '.';

/**
 * @ngdoc class
 * @name AtomicBlockParser
 * @description AtomicBlockParser is a helper class for the HTMLGenerator. It parses
 * Editor3 atomic blocks (image, table, embed, etc.).
 * @param {Object} contentState
 * @param {Array=} disabled A set of disabled elements (ie. ['table'] will ignore tables.
 */
export class AtomicBlockParser {
    constructor(contentState, disabled = []) {
        this.contentState = contentState;
        this.disabled = disabled;
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
        const entity = this.contentState.getEntity(entityKey);
        const data = entity.getData();

        switch (entity.getType()) {
        case 'IMAGE':
            return this.parseImage(data);
        case 'EMBED':
            return this.parseEmbed(data);
        case 'TABLE':
            return this.parseTable(data);
        default:
            return '<p><b>Unimplemented or disabled atomic block</b></p>';
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
    parseEmbed({data}) {
        if (data.qumuWidget) {
            return `
                <div class="embed-block">
                    <script src="https://video.fidelity.tv/widgets/1/application.js"></script>
                    <script>KV.widget(${JSON.stringify(data)});</script>
                    <div id="${data.selector.slice(1)}"></div>
                </div>
            `;
        }

        return `<div class="embed-block">${data.html}</div>`;
    }

    /**
     * @ngdoc method
     * @name AtomicBlockParser#parseImage
     * @param {Object} data Entity data.
     * @returns {string} HTML
     * @description Returns the HTML representation of an atomic 'IMAGE' block having
     * the passed entity data.
     */
    parseImage(data) {
        const {img} = data;
        const rendition = img.renditions.original || img.renditions.viewImage;
        const href = rendition.href;
        const alt = img.alt_text || '';

        let html = `<div class="image-block"><img src="${href}" alt="${alt}" />`;

        html += img.description_text
            ? `<span class="image-block__description">${img.description_text}</span>`
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

            return new HTMLGenerator(cellContentState, ['table']).html();
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
