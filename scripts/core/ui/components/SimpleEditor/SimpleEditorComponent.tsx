import React from 'react';
import {
    Editor,
    EditorState,
    ContentState,
    Modifier,
    SelectionState,
} from 'draft-js';
import './styles.scss';

export interface IProps {
    value: string;
    onChange: (newValue: string, props: IProps) => void;
    classes: string;
    field: string;
}

interface IState {
    editorState: EditorState;
    hasFocus: boolean;
}

export class SimpleEditorComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            editorState: this.createStateFromValue(props.value),
            hasFocus: false,
        };

        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
    }

    createStateFromValue(value: string) {
        return EditorState.createWithContent(
            ContentState.createFromText(value || ''),
        );
    }

    updateStateWithValue(value: string) {
        const {editorState} = this.state;
        const currentContent = editorState.getCurrentContent();
        const firstBlock = currentContent.getBlockMap().first();
        const lastBlock = currentContent.getBlockMap().last();
        const selectionAll = new SelectionState({
            anchorKey: firstBlock.getKey(),
            anchorOffset: 0,
            focusKey: lastBlock.getKey(),
            focusOffset: lastBlock.getLength(),
        });
        const newContent = Modifier.replaceText(
            currentContent,
            selectionAll,
            value,
        );

        return EditorState.push(editorState, newContent, 'insert-characters');
    }

    componentWillReceiveProps(newProps: IProps) {
        this.setState({
            editorState: this.updateStateWithValue(newProps.value),
        });
    }

    handleEditorChange(editorState: EditorState) {
        if (
            this.state.editorState.getCurrentContent() !==
            editorState.getCurrentContent()
        ) {
            const value = editorState.getCurrentContent().getPlainText();

            this.props.onChange(value, this.props);
        }

        this.setState({editorState});
    }

    onFocus() {
        this.setState({hasFocus: true});
    }

    onBlur() {
        this.setState({hasFocus: false});
    }
    render() {
        const classes = `${this.props.classes} ${
            this.state.hasFocus ? 'focus' : ''
        }`;

        return (
            <div className={classes}>
                <Editor
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    editorState={this.state.editorState}
                    onChange={this.handleEditorChange}
                />
            </div>
        );
    }
}
