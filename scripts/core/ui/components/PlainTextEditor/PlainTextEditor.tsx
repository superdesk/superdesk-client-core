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
import classNames from 'classnames';

export interface IProps {
    value: string;
    onChange: (newValue: string, data: IProps['onChangeData']) => void;
    onChangeData?: any;
    classes?: string;
    spellcheck?: boolean;
    language?: string;
    placeholder?: string;
    onFocus?: () => void;
    disabled?: boolean;
}

interface IState {
    editorState: EditorState;
    hasFocus: boolean;
}

function updateStateWithValue(value: string, editorState: EditorState) {
    const currentContent = editorState.getCurrentContent();
    const selectionAll = getDraftSelectionForEntireContent(editorState);
    const newContent = Modifier.replaceText(
        currentContent,
        selectionAll,
        value,
    );
    let newState = EditorState.set(editorState, {allowUndo: false});

    newState = EditorState.push(newState, newContent, 'insert-characters');

    return EditorState.set(newState, {allowUndo: true});
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

    runSpellchecker() {
        if (this.spellcheckerTimeout) {
            window.clearTimeout(this.spellcheckerTimeout);
        }

        this.spellcheckerTimeout = window.setTimeout(() => {
            const spellchecker = getSpellchecker(this.props.language);

            if (spellchecker == null) {
                return;
            }

            getSpellcheckWarningsByBlock(
                spellchecker,
                this.state.editorState,
            ).then((warningsByBlock) => {
                const spellcheckerDecorator = getSpellcheckingDecorator(
                    this.props.language,
                    warningsByBlock,
                    {disableContextMenu: true},
                );
                const decorator = new CompositeDecorator([
                    spellcheckerDecorator,
                ]);
                const editorStateDecorated = EditorState.set(
                    this.state.editorState,
                    {decorator},
                );

                this.setState({
                    editorState: editorStateDecorated,
                });
            });
        }, 500);
    }

    /**
     * Ideally we shouldn't use this method and use getDerivedStateFromProps instead.
     * That implementation does work but there's a bug similar to the one described here
     * https://github.com/facebook/draft-js/issues/1198#issuecomment-535651492
     * where the cursor jumps to the beginning of the text when we get the state from the props
     * This version works fine and we can still handle our own selection state
     * */
    UNSAFE_componentWillReceiveProps(props: IProps) {
        this.setState({editorState: updateStateWithValue(props.value || '', this.state.editorState)});
    }

    handleEditorChange(editorState: EditorState) {
        if (
            this.state.editorState.getCurrentContent() !==
            editorState.getCurrentContent()
        ) {
            const value = editorState.getCurrentContent().getPlainText();

            this.props.onChange(value, this.props.onChangeData);
        }

        this.selection = this.state.hasFocus
            ? editorState.getSelection()
            : null;

        this.setState({editorState}, () => {
            if (this.props.spellcheck) {
                this.runSpellchecker();
            }
        });
    }

    onFocus() {
        this.setState({hasFocus: true}, () => this.props.onFocus?.());
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
        const classes = classNames(
            'plain-text-editor',
            this.props.classes,
            {focus: this.state.hasFocus},
            {disabled: this.props.disabled},
        );

        let editorState = this.state.editorState;

        if (this.state.hasFocus && this.selection) {
            editorState = EditorState.forceSelection(
                editorState,
                this.selection,
            );
        }

        return (
            <div
                className={classes}
                onMouseDown={
                    /* This editor can be nested withing another one,
                     * so we must prevent event bubbling */
                    (ev) => ev.stopPropagation()
                }
                onKeyDown={(ev) => ev.stopPropagation()}
            >
                <Editor
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    editorState={editorState}
                    placeholder={this.props.placeholder || ''}
                    onChange={this.handleEditorChange}
                    handleKeyCommand={this.handleKeyCommand}
                    readOnly={this.props.disabled === true}
                />
            </div>
        );
    }
}
