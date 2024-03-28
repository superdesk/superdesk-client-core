import React from 'react';
import {connect} from 'react-redux';
import {EditorState} from 'draft-js';
import {ValidateCharacters} from './ValidateCharacters';

interface IProps {
    editorState: EditorState;
    fieldId: string;
}

export class ValidateCharactersComponent extends React.PureComponent<IProps> {
    render() {
        const text = this.props.editorState.getCurrentContent().getPlainText();

        return (
            <span className="disallowed-char-error" style={{float: 'none', margin: 0}}>
                <ValidateCharacters item={text} field={this.props.fieldId} />
            </span>
        );
    }
}

const mapStateToProps = (state) => ({
    editorState: state.editorState,
});

export const ValidateCharactersConnected = connect(mapStateToProps)(ValidateCharactersComponent);
