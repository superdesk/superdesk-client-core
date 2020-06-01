import React from 'react';
import {
    Editor,
    EditorState,
    ContentState,
    Modifier,
    SelectionState,
    CompositeDecorator,
} from 'draft-js';
import './styles.scss';
import {getSpellchecker} from 'core/editor3/components/spellchecker/default-spellcheckers';
import {getSpellcheckWarningsByBlock, getSpellcheckingDecorator} from 'core/editor3/components/spellchecker/SpellcheckerDecorator';
import {getDraftSelectionForEntireContent} from 'core/editor3/helpers/getDraftSelectionForEntireContent';

export interface IProps {
    value: string;
    onChange: (newValue: string, props: IProps) => void;
    classes: string;
    field: string;
    spellcheck?: boolean;
    language?: string;
}

interface IState {
    editorState: EditorState;
    hasFocus: boolean;
}

export class PlainTextEditor extends React.Component<IProps, IState> {
    spellcheckInProgress: boolean

    constructor(props) {
        super(props);

        this.state = {
            editorState: this.createStateFromValue(props.value),
            hasFocus: false,
        };

        this.handleEditorChange = this.handleEditorChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.spellcheckInProgress = false;
    }

    createStateFromValue(value: string) {
        return EditorState.createWithContent(
            ContentState.createFromText(value || ''),
        );
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
        if (!this.spellcheckInProgress) {
            const spellchecker = getSpellchecker(this.props.language);

            if (spellchecker == null) {
                return;
            }

            this.spellcheckInProgress = true;
            getSpellcheckWarningsByBlock(spellchecker, this.state.editorState)
                .then((warningsByBlock) => {
                    this.spellcheckInProgress = false;
                    const spellcheckerDecorator = getSpellcheckingDecorator(this.props.language, warningsByBlock, {disableContextMenu: true});
                    const decorator = new CompositeDecorator([spellcheckerDecorator]);
                    const editorState = this.state.editorState;
                    const editorStateDecorated = EditorState.set(this.state.editorState, {decorator});
                    const editorStateWithSelection = EditorState.forceSelection(editorStateDecorated, editorState.getSelection());

                    this.setState({
                        editorState: editorStateWithSelection,
                    });
                });
        }
    }

    componentWillReceiveProps(newProps: IProps) {
        if (newProps !== this.props) {
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

        let editorState;

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
