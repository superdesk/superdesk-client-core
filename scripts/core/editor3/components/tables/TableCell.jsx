import React, {Component} from 'react';
import {Editor, EditorState, ContentState, RichUtils} from 'draft-js';

export class TableCell extends Component {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.isSameState = this.isSameState.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onFocus = this.onFocus.bind(this);

        this.hasFocus = false;

        this.state = {
            editorState: props.contentState
                ? EditorState.createWithContent(props.contentState)
                : EditorState.createWithContent(ContentState.createFromText(''))
        };
    }

    handleKeyCommand(command) {
        const {editorState} = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);

        if (newState) {
            this.onChange(newState);
            return 'handled';
        }

        return 'not-handled';
    }

    onChange(editorState) {
        if (this.isSameState(editorState, this.state.editorState)) {
            return;
        }

        this.setState({editorState});
        this.props.onChange(editorState);
    }

    onClick(e) {
        e.stopPropagation();
        this.props.onFocus();
        setTimeout(this.cellEditor.focus, 0); // after action
    }

    onBlur(e) {
        this.hasFocus = false;
    }

    onFocus(e) {
        this.hasFocus = true;
    }

    isSameState(es1, es2) {
        return _.isEqual(es1.toJS(), es2.toJS());
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !this.isSameState(nextState.editorState, this.state.editorState);
    }

    render() {
        const {editorState} = this.state;

        return (
            <td onClick={this.onClick}>
                <Editor
                    editorState={editorState}
                    handleKeyCommand={this.handleKeyCommand}
                    onChange={this.onChange}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    ref={(el) => {
                        this.cellEditor = el;
                    }} />
            </td>
        );
    }
}

TableCell.propTypes = {
    contentState: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired,
    onFocus: React.PropTypes.func.isRequired
};
