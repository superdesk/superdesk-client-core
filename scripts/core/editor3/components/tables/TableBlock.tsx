import React from 'react';
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
export class TableBlockComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.onCellChange = this.onCellChange.bind(this);
        this.getCellEditorState = this.getCellEditorState.bind(this);
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
    onCellChange(row, col, cellEditorState) {
        const lastChangeType = cellEditorState.getLastChangeType();
        const {block, setActiveCell, editorState, parentOnChange} = this.props;
        const {data, needUpdate, forceUpdate} = setCell(this.getData(), row, col, cellEditorState);
        const newEditorState = setData(editorState, block, data, lastChangeType);
        const currentStyle = cellEditorState.getCurrentInlineStyle().toArray();
        const selection = cellEditorState.getSelection();

        if (needUpdate) {
            parentOnChange(newEditorState, forceUpdate);
        }

        setActiveCell(row, col, block.key, currentStyle, selection.toJS());
    }

    getCellEditorState(data, i, j) {
        const {currentStyle, selection}: any = this.props.activeCell || {};

        return getCell(data, i, j, currentStyle, selection);
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

    onFocus(i, j, currentStyle, selection) {
        const {setActiveCell, block} = this.props;
        const newSelection = selection.merge({hasFocus: true});

        setActiveCell(i, j, block.key, currentStyle, newSelection.toJS());
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

    onRedo() {
        const {editorState, parentOnChange} = this.props;
        const newEditorState = EditorState.redo(editorState);

        parentOnChange(newEditorState, false);
    }

    render() {
        const data = this.getData();
        const {numRows, numCols, withHeader} = data;

        const cx = classNames({
            'table-block': true,
            'table-header': withHeader,
        });

        return (
            <div className={cx} onMouseDown={this.onMouseDown}>
                <table>
                    <tbody>
                        {Array.from(new Array(numRows)).map((_, i) =>
                            <tr key={`col-${i}-${numRows}-${numCols}`}>
                                {Array.from(new Array(numCols)).map((__, j) =>
                                    <TableCell
                                        key={`cell-${i}-${j}-${numRows}-${numCols}`}
                                        readOnly={this.props.readOnly}
                                        editorState={this.getCellEditorState(data, i, j)}
                                        onChange={this.onCellChange.bind(this, i, j)}
                                        onUndo={this.onUndo.bind(this)}
                                        onRedo={this.onRedo.bind(this)}
                                        onFocus={this.onFocus.bind(this, i, j)} />,
                                )}
                            </tr>,
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
    activeCell: PropTypes.object,
    setActiveCell: PropTypes.func.isRequired,
    parentOnChange: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
    parentOnChange: (editorState, force) => dispatch(actions.changeEditorState(editorState, force)),
    setActiveCell: (i, j, key, currentStyle, selection) => dispatch(
        actions.setActiveCell(i, j, key, currentStyle, selection),
    ),
});

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    readOnly: state.readOnly,
    activeCell: state.activeCell,
});

export const TableBlock: React.StatelessComponent<any> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(TableBlockComponent);
