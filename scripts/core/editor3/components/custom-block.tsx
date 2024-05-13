import React from 'react';
import * as actions from '../actions';
import {connect} from 'react-redux';
import {EditorState, ContentBlock} from 'draft-js';
import {IActiveCell, TableBlock} from './tables/TableBlock';
import {IEditorStore} from 'core/editor3/store';

export const MULTI_LINE_QUOTE_CLASS = 'multi-line-quote';

interface IProps {
    block: ContentBlock;
    readOnly: boolean;
    editorState: EditorState;
    spellchecking: IEditorStore['spellchecking'];
    parentOnChange: (newEditorState: EditorState, force: boolean) => void;
    activeCell?: IActiveCell;
    setActiveCell: (row: number, col: number, blockKey: string, currentStyle: Array<string>, selection: any) => void;
}

export class CustomBlockComponent extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    render() {
        return (
            <div style={{border: '1px solid blue'}}>
                <TableBlock
                    fullWidth
                    className={MULTI_LINE_QUOTE_CLASS}
                    toolbarStyle="multiLineQuote"
                    tableKind="custom-block"
                    block={this.props.block}
                    readOnly={this.props.readOnly}
                    activeCell={this.props.activeCell}
                    editorState={this.props.editorState}
                    setActiveCell={this.props.setActiveCell}
                    parentOnChange={this.props.parentOnChange}
                    spellchecking={this.props.spellchecking}
                />
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch) => ({
    parentOnChange: (editorState, force) => dispatch(actions.changeEditorState(editorState, force)),
});

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    readOnly: state.readOnly,
});

export const CustomBlock = connect(
    mapStateToProps,
    mapDispatchToProps,
)(CustomBlockComponent);
