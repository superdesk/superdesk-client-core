import React from 'react';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {EditorState, ContentBlock} from 'draft-js';
import {TableBlock} from '../tables/TableBlock';
import {IActiveCell} from 'superdesk-api';

interface IProps {
    block: ContentBlock;
    readOnly: boolean;
    editorState: EditorState;
    parentOnChange: (newEditorState: EditorState, force: boolean) => void;
    activeCell?: IActiveCell;
    setActiveCell: (row: number, col: number, blockKey: string, currentStyle: Array<string>, selection: any) => void;
}

/**
 * Supports quotes that may contain multiple blocks including headings.
 */
export class MultiLineQuoteComponent extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    render() {
        return (
            <TableBlock
                className="multi-line-quote"
                toolbarStyle="multiLineQuote"
                block={this.props.block}
                readOnly={this.props.readOnly}
                activeCell={this.props.activeCell}
                editorState={this.props.editorState}
                setActiveCell={this.props.setActiveCell}
                parentOnChange={this.props.parentOnChange}
            />
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

export const MultiLineQuote = connect(
    mapStateToProps,
    mapDispatchToProps,
)(MultiLineQuoteComponent);
