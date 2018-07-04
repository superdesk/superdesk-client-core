import React, {Component} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {TableCell} from '.';
import {EditorState} from 'draft-js';
import {getCell, setCell, getData, setData} from '../../helpers/table';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableBlockComponent
 * @param block {Object} Information about this atomic block.
 * @param contentState {Object} The content state containing this atomic block.
 * @param setActiveCell {Function} When called, sets the parent (main) editor to read only.
 * @description Handles a cell in the table, as well as the containing editor.
 */
export class TableBlockComponent extends Component {
    constructor(props) {
        super(props);

        this.setCell = this.setCell.bind(this);
        this.getData = this.getData.bind(this);
        this.onFocus = this.onFocus.bind(this);
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#setCell
     * @param {Number} row The row of the cell in the table
     * @param {Number} col The column of the cell in the table
     * @param {Object} cellEditorState The state of the editor within the cell
     * @description Updates data about this cell inside the entity for this atomic
     * block.
     */
    setCell(row, col, cellEditorState) {
        const {block, editorState, parentOnChange} = this.props;
        const newData = setCell(this.getData(), row, col, cellEditorState);
        const newEditorState = setData(editorState, block, newData);

        parentOnChange(newEditorState, newData.forceUpdate);
    }

    /**
     * @ngdoc method
     * @name TableBlockComponent#data
     * @description Returns the data contained in the entity of this atomic block.
     * @return {Object}
     */
    getData() {
        const {block, editorState} = this.props;

        return getData(editorState, block);
    }

    onFocus(i, j, event) {
        const {setActiveCell, block} = this.props;

        event.stopPropagation();
        setActiveCell(i, j, block.key);
    }

    // onMouseDown is used in the main editor to set focus and stop table editing
    onMouseDown(event) {
        event.stopPropagation();
    }

    onUndo() {
        const {editorState, parentOnChange} = this.props;
        const newEditorState = EditorState.undo(editorState);

        parentOnChange(newEditorState, false);
    }

    render() {
        const data = this.getData();
        const {numRows, numCols, withHeader} = data;

        let cx = classNames({
            'table-block': true,
            'table-header': withHeader,
        });

        return (
            <div className={cx} onMouseDown={this.onMouseDown}>
                <table>
                    <tbody>
                        {Array.from(new Array(numRows)).map((v, i) =>
                            <tr key={`col-${i}-${numRows}-${numCols}`}>
                                {Array.from(new Array(numCols)).map((v, j) =>
                                    <TableCell
                                        key={`cell-${i}-${j}-${numRows}-${numCols}`}
                                        readOnly={this.props.readOnly}
                                        editorState={getCell(data, i, j)}
                                        onChange={this.setCell.bind(this, i, j)}
                                        onUndo={this.onUndo.bind(this)}
                                        onFocus={this.onFocus.bind(this, i, j)} />
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
    block: PropTypes.object.isRequired,
    readOnly: PropTypes.bool.isRequired,
    editorState: PropTypes.object.isRequired,
    setActiveCell: PropTypes.func.isRequired,
    parentOnChange: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    parentOnChange: (editorState, force) => dispatch(actions.changeEditorState(editorState, force)),
    setActiveCell: (i, j, key) => dispatch(actions.setActiveCell(i, j, key)),
});

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    readOnly: state.readOnly,
});

export const TableBlock = connect(mapStateToProps, mapDispatchToProps)(TableBlockComponent);
