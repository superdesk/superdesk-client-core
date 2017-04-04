import React, {Component} from 'react';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {TableCell} from '.';
import {ContentState, convertToRaw, convertFromRaw} from 'draft-js';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableBlockComponent
 * @param block {Object} Information about this atomic block.
 * @param contentState {Object} The content state containing this atomic block.
 * @param setReadOnly {Function} When called, sets the parent (main) editor to read only.
 * @param parentReadOnly {Boolean} The readOnly state of the main editor.
 * @description Handles a cell in the table, as well as the containing editor.
 */
export class TableBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.setCell = this.setCell.bind(this);
        this.getCell = this.getCell.bind(this);
        this.addRow = this.addRow.bind(this);
        this.addColumn = this.addColumn.bind(this);
        this.data = this.data.bind(this);
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#setCell
     * @param {Number} row The row of the cell in the table
     * @param {Number} col The column of the cell in the table
     * @param {Object} cellState The state of the editor within the cell
     * @description Updates data about this cell inside the entity for this atomic
     * block.
     */
    setCell(row, col, cellState) {
        const cellContentState = cellState.getCurrentContent();
        const data = this.data();
        const {block, contentState, editorState, parentOnChange} = this.props;
        const entityKey = block.getEntityAt(0);

        if (!data.cells[row]) {
            data.cells[row] = [];
        }

        data.cells[row][col] = convertToRaw(cellContentState);

        contentState.replaceEntityData(entityKey, {data});
        parentOnChange(editorState);
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#getCell
     * @param {Number} row The row of the cell in the table
     * @param {Number} col The column of the cell in the table
     * @description Retrieves the content state of the cell at row/col.
     */
    getCell(row, col) {
        const {cells} = this.data();

        if (!cells[row] || !cells[row][col]) {
            return ContentState.createFromText('');
        }

        return convertFromRaw(cells[row][col]);
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#data
     * @description Returns the data contained in the entity of this atomic block.
     * @return {Object}
     */
    data() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);
        const {data} = entity.getData();

        return data;
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#addRow
     * @param {Event} e Click event from the command.
     * @description Adds a new row to this table.
     */
    addRow(e) {
        e.stopPropagation();

        const entityKey = this.props.block.getEntityAt(0);
        const {contentState} = this.props;
        const data = this.data();

        data.numRows++;
        contentState.mergeEntityData(entityKey, {data});

        this.forceUpdate();
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#addColumn
     * @param {Event} e Click event from the command.
     * @description Adds a new column to this table.
     */
    addColumn(e) {
        e.stopPropagation();

        const entityKey = this.props.block.getEntityAt(0);
        const {contentState} = this.props;
        const data = this.data();

        data.numCols++;
        contentState.mergeEntityData(entityKey, {data});

        this.forceUpdate();
    }

    render() {
        const {numRows, numCols} = this.data();
        const {setReadOnly, parentReadOnly} = this.props;

        return (
            <div className="table-block">
                {parentReadOnly ? <div className="table-block__controls">
                    <span className="add-row" onClick={this.addRow}>+ Row</span>
                    <span className="add-col" onClick={this.addColumn}>+ Col</span>
                </div> : null}
                <table>
                    <tbody>
                        {Array.from(new Array(numRows)).map((v, i) =>
                            <tr key={`col-${i}`}>
                                {Array.from(new Array(numCols)).map((v, j) =>
                                    <TableCell
                                        key={`cell-${i}-${j}`}
                                        contentState={this.getCell(i, j)}
                                        onChange={this.setCell.bind(this, i, j)}
                                        onFocus={setReadOnly} />
                                )}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }
}

TableBlockComponent.propTypes = {
    block: React.PropTypes.object.isRequired,
    contentState: React.PropTypes.object.isRequired,
    editorState: React.PropTypes.object.isRequired,
    setReadOnly: React.PropTypes.func.isRequired,
    parentOnChange: React.PropTypes.func.isRequired,
    parentReadOnly: React.PropTypes.bool.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    parentOnChange: (editorState) => dispatch(actions.changeEditorState(editorState)),
    setReadOnly: (e) => dispatch(actions.setReadOnly())
});

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    parentReadOnly: state.readOnly
});

export const TableBlock = connect(mapStateToProps, mapDispatchToProps)(TableBlockComponent);
