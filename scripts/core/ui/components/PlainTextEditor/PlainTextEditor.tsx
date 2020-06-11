import React from 'react';
import {
    Editor,
    EditorState,
    ContentState,
    Modifier,
    SelectionState,
    CompositeDecorator,
    DraftHandleValue,
    DraftEditorCommand,
} from 'draft-js';
import './styles.scss';
import {getSpellchecker} from 'core/editor3/components/spellchecker/default-spellcheckers';
import {
    getSpellcheckWarningsByBlock,
    getSpellcheckingDecorator,
} from 'core/editor3/components/spellchecker/SpellcheckerDecorator';
import {getDraftSelectionForEntireContent} from 'core/editor3/helpers/getDraftSelectionForEntireContent';

export interface IProps {
    value: string;
    onChange: (newValue: string, data: IProps['onChangeData']) => void;
    onChangeData: any;
    classes: string;
    spellcheck?: boolean;
    language?: string;
    placeholder?: string;
}

interface IState {
    editorState: EditorState;
    hasFocus: boolean;
}

export class PlainTextEditor extends React.Component<IProps, IState> {
    spellcheckerTimeout?: number;
    selection: SelectionState;

    constructor(props) {
        super(props);

        this.state = {
            editorState: EditorState.createWithContent(
                ContentState.createFromText(props.value || ''),
            ),
            hasFocus: false,
        };

        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
    }

    componentDidMount() {
        if (this.props.spellcheck) {
            this.runSpellchecker();
        }
    }

    updateStateWithValue(value: string) {
        const {editorState} = this.state;
        const currentContent = editorState.getCurrentContent();
        const selectionAll = getDraftSelectionForEntireContent(editorState);
        const newContent = Modifier.replaceText(currentContent, selectionAll, value);

        if (this.props.spellcheck) {
            this.runSpellchecker();
        }

        let newState = EditorState.set(editorState, {allowUndo: false});

        newState = EditorState.push(newState, newContent, 'insert-characters');

        return EditorState.set(newState, {allowUndo: true});
    }

    runSpellchecker() {
        if (this.spellcheckerTimeout) {
            window.clearTimeout(this.spellcheckerTimeout);
        }

        this.spellcheckerTimeout = window.setTimeout(() => {
            const spellchecker = getSpellchecker(this.props.language);

            if (spellchecker == null) {
                return;
            }

            getSpellcheckWarningsByBlock(spellchecker, this.state.editorState)
                .then((warningsByBlock) => {
                    const spellcheckerDecorator =
                        getSpellcheckingDecorator(this.props.language, warningsByBlock, {disableContextMenu: true});
                    const decorator = new CompositeDecorator([spellcheckerDecorator]);
                    const editorState = this.state.editorState;
                    const editorStateDecorated = EditorState.set(this.state.editorState, {decorator});
                    const editorStateWithSelection =
                        EditorState.forceSelection(editorStateDecorated, editorState.getSelection());

                    this.setState({
                        editorState: editorStateWithSelection,
                    });
                });
        }, 500);
    }

    componentWillReceiveProps(newProps: IProps) {
        if (newProps.value !== this.props.value) {
            this.setState({
                editorState: this.updateStateWithValue(newProps.value),
            });
        }
    }

    handleEditorChange(editorState: EditorState) {
        if (
            this.state.editorState.getCurrentContent() !==
            editorState.getCurrentContent()
        ) {
            const value = editorState.getCurrentContent().getPlainText();

            this.props.onChange(value, this.props.onChangeData);
        }

        this.selection = editorState.getSelection();
        this.setState({editorState});
    }

    onFocus() {
        this.setState({hasFocus: true});
    }

    onBlur() {
        this.setState({hasFocus: false});
    }

    handleKeyCommand(command: DraftEditorCommand): DraftHandleValue {
        if (command === 'split-block') {
            return 'handled'; // disable Enter
        }

        return 'not-handled';
    }

    render() {
        const classes = `${this.props.classes} ${
            this.state.hasFocus ? 'focus' : ''
        } plain-text-editor`;

        let editorState = this.state.editorState;

        if (this.state.hasFocus && this.selection) {
            editorState = EditorState.forceSelection(editorState, this.selection);
        }

        return (
            <div className={classes}>
                <Editor
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    editorState={editorState}
                    placeholder={this.props.placeholder || ''}
                    onChange={this.handleEditorChange}
                    handleKeyCommand={this.handleKeyCommand}
                />
            </div>
        );
    }
}
