import * as React from 'react';
import {connect} from 'react-redux';
import {EditorState} from 'draft-js';
import {TextStatistics} from './text-statistics';
import {IEditorStore} from 'core/editor3/store';

interface IProps {
    editorState: EditorState;
    language?: string;
    limit?: number;
    singleLine?: boolean;
}

class TextStatisticsComponent extends React.PureComponent<IProps> {
    render() {
        const text = this.props.editorState.getCurrentContent().getPlainText();

        return (
            <TextStatistics
                text={text}
                limit={this.props.limit}
                language={this.props.language}
                singleLine={this.props.singleLine}
            />
        );
    }
}


const mapStateToProps = (state: IEditorStore) => ({
    editorState: state.editorState,
    limit: state.limitConfig?.chars,
    singleLine: state.singleLine,
});

export const TextStatisticsConnected = connect(mapStateToProps)(TextStatisticsComponent);
