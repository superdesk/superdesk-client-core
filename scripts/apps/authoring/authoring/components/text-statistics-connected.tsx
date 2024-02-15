import * as React from 'react';
import {connect} from 'react-redux';
import {EditorState} from 'draft-js';
import {TextStatistics} from './text-statistics';

interface IProps {
    editorState: EditorState;
    language?: string;
    limit?: number;
}

class TextStatisticsComponent extends React.PureComponent<IProps> {
    render() {
        const text = this.props.editorState.getCurrentContent().getPlainText();

        return (
            <TextStatistics
                text={text}
                limit={this.props.limit}
                language={this.props.language}
            />
        );
    }
}


const mapStateToProps = (state) => ({
    editorState: state.editorState,
    limit: state.limitConfig?.chars,
});

export const TextStatisticsConnected = connect(mapStateToProps)(TextStatisticsComponent);
