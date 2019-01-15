import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {TableCell} from '.';
import {EditorState, SelectionState, ContentBlock} from 'draft-js';
import {getCell, setCell, getData, setData} from '../../helpers/table';

interface IProps {
    block: ContentBlock;
    readOnly: boolean;
    editorState: EditorState;
    activeCell?: any;
    setActiveCell: (row: number, col: number, blockKey: string, currentStyle: Array<string>, selection: any) => void;
    parentOnChange: (newEditorState: EditorState, force: boolean) => void;
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableBlockComponent
 * @description Handles a cell in the table, as well as the containing editor.
 */
export class TableBlockComponent extends React.Component<IProps, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);

        this.onCellChange = this.onCellChange.bind(this);
        this.getCellEditorState = this.getCellEditorState.bind(this);
        this.getData = this.getData.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onHistoryAction = this.onHistoryAction.bind(this);
        this.onRedo = this.onRedo.bind(this);
        this.onUndo = this.onUndo.bind(this);
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
    onCellChange(row: number, col: number, cellEditorState: EditorState) {
        const lastChangeType = cellEditorState.getLastChangeType();
        const {block, setActiveCell, editorState, parentOnChange} = this.props;
        const {data, needUpdate, forceUpdate} = setCell(this.getData(), row, col, cellEditorState);
        const newEditorState = setData(editorState, block, data, lastChangeType);
        const currentStyle = cellEditorState.getCurrentInlineStyle().toArray();
        const selection = cellEditorState.getSelection();

        if (needUpdate) {
            parentOnChange(newEditorState, forceUpdate);
        }

        setActiveCell(row, col, block.getKey(), currentStyle, selection.toJS());
    }

    getCellEditorState(data, i, j): EditorState {
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

        return getData(editorState.getCurrentContent(), block.getKey());
    }

    onFocus(i: number, j: number, currentStyle: Array<string>, selection: SelectionState) {
        const {setActiveCell, block} = this.props;
        const newSelection = selection.merge({hasFocus: true});

        setActiveCell(i, j, block.getKey(), currentStyle, newSelection.toJS());
    }

    // onMouseDown is used in the main editor to set focus and stop table editing
    onMouseDown(event) {
        event.stopPropagation();
    }

    onHistoryAction(action: 'redo' | 'undo') {
        const {editorState, parentOnChange, block, setActiveCell, activeCell} = this.props;
        const newEditorState = EditorState[action](editorState);
        const data = getData(newEditorState.getCurrentContent(), block.getKey());
        const cellEditorState = this.getCellEditorState(data, activeCell.i, activeCell.j);
        const currentStyle = cellEditorState.getCurrentInlineStyle().toArray();

        const selection = cellEditorState.getSelection().toJS();
        const selectedBlock = cellEditorState.getCurrentContent().getBlockForKey(selection.anchorKey);
        const overflow = selection.anchorOffset > selectedBlock.getLength();

        if (overflow) {
            selection.anchorOffset = selection.focusOffset = selectedBlock.getLength();
        }

        parentOnChange(newEditorState, false);
        setActiveCell(activeCell.i, activeCell.j, block.getKey(), currentStyle, selection);
    }

    onUndo() {
        this.onHistoryAction('undo');
    }

    onRedo() {
        this.onHistoryAction('redo');
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
