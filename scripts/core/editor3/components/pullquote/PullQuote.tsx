import React from 'react';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {EditorState, ContentBlock} from 'draft-js';
import {TableBlock} from '../tables/TableBlock';

interface IProps {
    block: ContentBlock;
    readOnly: boolean;
    editorState: EditorState;
    parentOnChange: (newEditorState: EditorState, force: boolean) => void;
    activeCell?: any;
    setActiveCell: (row: number, col: number, blockKey: string, currentStyle: Array<string>, selection: any) => void;
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name PullQuoteComponent
 * @description Handles multi line, styled quotes.
 */
export class PullQuoteComponent extends React.Component<IProps> {
    static propTypes: any;
    static defaultProps: any;

    render() {
        const {
            block,
            editorState,
            parentOnChange,
            readOnly,
            setActiveCell,
            activeCell,
        } = this.props;

        return (
            <div
                style={{
                    fontStyle: 'italic',
                    fontWeight: 'lighter',
                }}
            >
                <TableBlock
                    block={block}
                    editorState={editorState}
                    parentOnChange={parentOnChange}
                    readOnly={readOnly}
                    setActiveCell={setActiveCell}
                    activeCell={activeCell}
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

export const PullQuote = connect(
    mapStateToProps,
    mapDispatchToProps,
)(PullQuoteComponent);
