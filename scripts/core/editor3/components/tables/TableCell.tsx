import React from 'react';
import {
    Editor,
    RichUtils,
    getDefaultKeyBinding,
    DraftHandleValue,
    SelectionState,
    EditorState,
    convertToRaw,
} from 'draft-js';
import {getSelectedEntityType, getSelectedEntityRange} from '../links/entityUtils';
import {customStyleMap} from '../customStyleMap';
import {getSpellchecker} from '../spellchecker/default-spellcheckers';
import {getSpellcheckWarningsByBlock} from '../spellchecker/SpellcheckerDecorator';
import {isEqual, throttle} from 'lodash';
import {getDecorators, IEditorStore} from 'core/editor3/store';
import {addInternalEventListener} from 'core/internal-events';

interface IProps {
    editorState: EditorState;
    spellchecking: IEditorStore['spellchecking'];
    readOnly: boolean;
    onChange: (e: EditorState) => void;
    onUndo: () => void;
    onRedo: () => void;
    onFocus: (styles: Array<string>, selection: SelectionState) => void;
    fullWidth?: boolean;
}

interface IState {
    editorState: EditorState;
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name TableCell
 * @param contentState {Object}
 * @param onChange {Function}
 * @param onFocus {Function}
 * @description Handles a cell in the table, as well as the containing editor.
 */
export class TableCell extends React.Component<IProps, IState> {
    private spellcheckAbortController: AbortController;
    private eventListeners: Array<() => void>;

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.keyBindingFn = this.keyBindingFn.bind(this);
        this.spellcheckAbortController = new AbortController();

        this.spellcheck = throttle(this.spellcheck.bind(this), 1000, {leading: true});

        this.state = {editorState: props.editorState};

        this.eventListeners = [];
    }

    /**
     * @ngdoc method
     * @name TableCell#keyBindingFn
     * @param {Event} e
     * @description DraftJS key binding function.
     */
    keyBindingFn(e) {
        if (e.ctrlKey && e.key === 'z') {
            return 'parent-undo';
        }

        if (e.ctrlKey && e.key === 'y') {
            return 'parent-redo';
        }

        if (e.ctrlKey && e.key === 'l') {
            return 'toggle-link';
        }

        return getDefaultKeyBinding(e);
    }

    /**
     * @ngdoc method
     * @name TableCell#handleKeyCommand
     * @param {string} command
     * @description DraftJS key command handler.
     */
    handleKeyCommand(command: string): DraftHandleValue {
        const {editorState} = this.state;
        let newState;

        switch (command) {
        case 'parent-undo':
            this.props.onUndo();
            return 'handled';

        case 'parent-redo':
            this.props.onRedo();
            return 'handled';

        case 'toggle-link':
            newState = getSelectedEntityType(this.state.editorState) === 'LINK'
                ? this.removeLink()
                : this.addLink();
            break;

        default:
            newState = RichUtils.handleKeyCommand(editorState, command);
            break;
        }

        if (newState) {
            this.onChange(newState);
            return 'handled';
        }

        return 'not-handled';
    }

    /**
     * @ngdoc method
     * @name TableCell#addLink
     * @description Adds a new link on top of the current selection. If the selection
     * is collapsed, no action is taken.
     */
    addLink() {
        const {editorState} = this.state;

        // can't add a link if selection is collapsed
        if (editorState.getSelection().isCollapsed()) {
            return editorState;
        }

        // eslint-disable-next-line no-alert
        const url = prompt('Enter a URL');
        const contentState = editorState.getCurrentContent().createEntity('LINK', 'MUTABLE', {url});

        return RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            contentState.getLastCreatedEntityKey(),
        );
    }

    /**
     * @ngdoc method
     * @name TableCell#removeLink
     * @description Removes the link behind the selection focus.
     */
    removeLink() {
        const {editorState} = this.state;
        let stateAfterChange = editorState;

        getSelectedEntityRange(editorState,
            (start, end) => {
                const selection = editorState.getSelection();
                const entitySelection = selection.merge({
                    anchorOffset: start,
                    focusOffset: end,
                });

                stateAfterChange = RichUtils.toggleLink(editorState, entitySelection as SelectionState, null);
            },
        );

        return stateAfterChange;
    }

    /**
     * @ngdoc method
     * @name TableCell#onChange
     * @param {Object} editorState the new editor state.
     * @description Triggered on changes to the cell's state.
     */
    onChange(editorState: EditorState) {
        const selection = editorState.getSelection();

        this.setState(
            {editorState},
            () => {
                if (selection.getHasFocus()) {
                    this.props.onChange(editorState);
                }
            },
        );
    }

    onFocus(event) {
        const {editorState} = this.state;
        const selection = editorState.getSelection();
        const currentStyle = editorState.getCurrentInlineStyle().toArray();

        event.stopPropagation();
        this.props.onFocus(currentStyle, selection);
    }

    spellcheck(): void {
        this.spellcheckAbortController.abort();
        this.spellcheckAbortController = new AbortController();

        const {editorState} = this.state;
        const {spellchecking} = this.props;
        const spellchecker = getSpellchecker(spellchecking.language);

        (
            spellchecker == null ?
                Promise.resolve({}) // if spellchecker is no longer available, clear marked ranges
                : getSpellcheckWarningsByBlock(
                    spellchecker,
                    editorState,
                    this.spellcheckAbortController.signal,
                )
        ).then((spellcheckWarningsByBlock) => {
            const nextEditorState = EditorState.set(
                editorState,
                {
                    decorator: getDecorators(
                        spellchecking.enabled,
                        spellchecking.language,
                        spellcheckWarningsByBlock,
                    ).decorator,
                },
            );

            this.onChange(nextEditorState);
        });
    }

    componentDidMount(): void {
        // it needs to run unconditionally on mount to apply decorators even if spellchecking is off
        this.spellcheck();

        this.eventListeners.push(
            addInternalEventListener('editor3SpellcheckerActionWasExecuted', this.spellcheck),
        );
    }

    componentWillUnmount(): void {
        for (const unregisterEventListener of this.eventListeners) {
            unregisterEventListener();
        }
    }

    componentWillReceiveProps(nextProps: IProps) {
        const contentChanged = !isEqual(
            convertToRaw(this.state.editorState.getCurrentContent()),
            convertToRaw(nextProps.editorState.getCurrentContent()),
        );

        if (contentChanged) {
            this.setState(
                {editorState: nextProps.editorState},
                () => {
                    this.spellcheck();
                },
            );
        }
    }

    componentDidUpdate(prevProps: IProps, prevState: IState): void {
        const contentChanged = this.state.editorState.getCurrentContent() !== prevState.editorState.getCurrentContent();
        const spellcheckerConfigChanged =
            this.props.spellchecking.enabled !== prevProps.spellchecking.enabled
            || this.props.spellchecking.language !== prevProps.spellchecking.language;

        if (contentChanged || spellcheckerConfigChanged) {
            this.spellcheck();
        }
    }

    render() {
        const {editorState} = this.state;
        const {readOnly} = this.props;
        const fullWidthStyle = this.props.fullWidth ? {width: '100%'} : {};

        return (
            <td
                // Disabling to prevent misbehavior and bugs when dragging & dropping text
                onDragStart={(e) => {
                    e.preventDefault();
                }}
                style={fullWidthStyle}
                onClick={(event) => event.stopPropagation()}
            >
                <Editor
                    onFocus={this.onFocus}
                    editorState={editorState}
                    customStyleMap={customStyleMap}
                    handleKeyCommand={this.handleKeyCommand}
                    readOnly={readOnly}
                    onChange={this.onChange}
                    keyBindingFn={this.keyBindingFn}
                />
            </td>
        );
    }
}
