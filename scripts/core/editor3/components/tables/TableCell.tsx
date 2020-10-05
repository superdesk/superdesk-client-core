import React from 'react';
import PropTypes from 'prop-types';
import {Editor, RichUtils, getDefaultKeyBinding, DraftHandleValue, SelectionState, EditorState} from 'draft-js';
import {getSelectedEntityType, getSelectedEntityRange} from '../links/entityUtils';
import {customStyleMap} from '../customStyleMap';

interface IProps {
    editorState: EditorState;
    readOnly: boolean;
    onChange: (e: EditorState) => void;
    onUndo: () => void;
    onRedo: () => void;
    onFocus: (styles: Array<string>, selection: SelectionState) => void;
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
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.keyBindingFn = this.keyBindingFn.bind(this);

        this.state = {editorState: props.editorState};
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

    componentWillReceiveProps(nextProps) {
        this.setState({
            editorState: nextProps.editorState,
        });
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

        if (!selection.getHasFocus()) {
            this.setState({editorState});

            return;
        }

        this.setState({editorState},
            () => this.props.onChange(editorState),
        );
    }

    onFocus(event) {
        const {editorState} = this.state;
        const selection = editorState.getSelection();
        const currentStyle = editorState.getCurrentInlineStyle().toArray();

        event.stopPropagation();
        this.props.onFocus(currentStyle, selection);
    }

    render() {
        const {editorState} = this.state;
        const {readOnly} = this.props;

        return (
            <td onClick={(event) => event.stopPropagation()}>
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
