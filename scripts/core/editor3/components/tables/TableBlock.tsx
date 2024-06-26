import React from 'react';
import classNames from 'classnames';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {TableCell} from './TableCell';
import {EditorState, SelectionState, ContentBlock} from 'draft-js';
import {getCell, setCell, getData, setData} from '../../helpers/table';
import {IEditorStore} from 'core/editor3/store';

export type ITableKind = 'table' | 'multi-line-quote' | 'custom-block';

export interface IActiveCellTable {
    tableKind: 'table';
}

export interface IActiveCellMultiLineQuote {
    tableKind: 'multi-line-quote';
}

export interface IActiveCellCustomBlock {
    tableKind: 'custom-block';
    vocabularyId: string;
}

export type IActiveCellAdditional = IActiveCellTable | IActiveCellMultiLineQuote | IActiveCellCustomBlock;

export interface IActiveCell {
    i: number; // row
    j: number; // column
    key: string;
    currentStyle: Array<string>;
    selection: import('draft-js').SelectionState;
    additional: IActiveCellAdditional;
}

export interface ISetActiveCellReturnType {
    type: 'EDITOR_SET_CELL';
    payload: IActiveCell;
}

interface IReduxStateProps {
    editorState: EditorState;
    activeCell?: IActiveCell;
    readOnly: IEditorStore['readOnly'];
}

interface IDispatchProps {
    setActiveCell: (activeCell: IActiveCell) => ISetActiveCellReturnType;
    parentOnChange: (newEditorState: EditorState, force: boolean) => void;
}

interface IOwnProps {
    block: ContentBlock;
    spellchecking: IEditorStore['spellchecking'];
    additional: IActiveCellAdditional;
    className?: string;
    fullWidth?: boolean;
}

type IProps = IOwnProps & IReduxStateProps & IDispatchProps;

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableBlockComponent
 * @description Handles a cell in the table, as well as the containing editor.
 */
export class TableBlockComponent extends React.Component<IProps> {
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

        const cell: IActiveCell = {
            i: row,
            j: col,
            key: block.getKey(),
            currentStyle: currentStyle,
            selection: selection.toJS(),
            additional: this.props.additional,
        };

        setActiveCell(cell);
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

        const cell: IActiveCell = {
            i: i,
            j: j,
            key: block.getKey(),
            currentStyle: currentStyle,
            selection: newSelection.toJS(),
            additional: this.props.additional,
        };

        setActiveCell(cell);
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

        const cell: IActiveCell = {
            i: activeCell.i,
            j: activeCell.j,
            key: block.getKey(),
            currentStyle: currentStyle,
            selection: selection,
            additional: this.props.additional,
        };

        setActiveCell(cell);
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
        const cx = this.props.className != null
            ? this.props.className
            : classNames('table-inside', {
                'table-block': true,
                'table-header': withHeader,
            });

        const fullWidthStyle = this.props.fullWidth ? {width: '100%'} : {};

        return (
            <div
                style={fullWidthStyle}
                className={cx}
                onMouseDown={(e) => {
                    this.onMouseDown(e);
                }}
                data-test-id="table-block"
            >
                <table style={fullWidthStyle}>
                    <tbody style={fullWidthStyle}>
                        {Array.from(new Array(numRows)).map((_, i) => (
                            <tr style={fullWidthStyle} key={`col-${i}-${numRows}-${numCols}`}>
                                {Array.from(new Array(numCols)).map((__, j) => (
                                    <TableCell
                                        fullWidth={Object.keys(fullWidthStyle).length > 0}
                                        key={`cell-${i}-${j}-${numRows}-${numCols}`}
                                        readOnly={this.props.readOnly}
                                        editorState={this.getCellEditorState(data, i, j)}
                                        spellchecking={this.props.spellchecking}
                                        onChange={this.onCellChange.bind(this, i, j)}
                                        onUndo={this.onUndo.bind(this)}
                                        onRedo={this.onRedo.bind(this)}
                                        onFocus={(styles, selection) => this.onFocus(i, j, styles, selection)}
                                    />
                                ),
                                )}
                            </tr>
                        ),
                        )}
                    </tbody>
                </table>
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch) => ({
    parentOnChange: (editorState, force) => dispatch(actions.changeEditorState(editorState, force)),
    setActiveCell: (activeCell: IActiveCell) => dispatch(
        actions.setActiveCell(activeCell),
    ),
});

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    readOnly: state.readOnly,
    activeCell: state.activeCell,
});

export const TableBlock: React.ComponentType<IOwnProps> = connect<IReduxStateProps, IDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps,
)(TableBlockComponent);
