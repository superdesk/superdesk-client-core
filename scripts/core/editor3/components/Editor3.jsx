import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {
    Editor,
    CompositeDecorator,
    RichUtils,
    Modifier,
    EditorState,
    getDefaultKeyBinding,
} from 'draft-js';

import {connect} from 'react-redux';
import Toolbar from './toolbar';
import * as actions from '../actions';
import {SpellcheckerDecorator} from './spellchecker';
import {LinkDecorator} from './links';
import {blockRenderer} from './blockRenderer';
import {customStyleMap} from './customStyleMap';
import classNames from 'classnames';
import {handlePastedText} from './handlePastedText';
import {getEntityTypeAfterCursor, getEntityTypeBeforeCursor} from './links/entityUtils';
import {HighlightsPopup} from './HighlightsPopup';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Editor3
 * @param {Boolean} readOnly if true the editor is read only
 * @param {Boolean} showToolbar if true the editor will show the toolbar
 * @param {editorState} the current state of draftjs editor
 * @param {Function} onChange the callback executed when the editor value is changed
 * @param {Function} onTab the callback for onTab event
 * @description Editor3 is a draft.js based editor that support customizable
 *  formatting, spellchecker and media files.
 */
export class Editor3Component extends React.Component {
    static getDecorator(disableSpellchecker) {
        if (disableSpellchecker) {
            return new CompositeDecorator([LinkDecorator]);
        }
        return new CompositeDecorator([
            LinkDecorator,
            SpellcheckerDecorator
        ]);
    }

    constructor(props) {
        super(props);

        this.editorKey = null;

        this.focus = this.focus.bind(this);
        this.allowItem = this.allowItem.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragDrop = this.onDragDrop.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.handleBeforeInput = this.handleBeforeInput.bind(this);
        this.keyBindingFn = this.keyBindingFn.bind(this);
    }

    /**
     * @ngdoc method
     * @name Editor3#focus
     * @description Handle the editor get focus event
     */
    focus() {
        this.props.unlock();
    }

    /**
     * @ngdoc method
     * @name Editor3#allowItem
     * @returns {Boolean} Returns true if the item is permitted.
     * @description Check if the editor accept images and if current item is valid media.
     */
    allowItem(e) {
        const {editorFormat, readOnly, singleLine} = this.props;
        const mediaType = e.originalEvent.dataTransfer.types[0] || '';
        const isValidMedia = [
            'application/superdesk.item.picture',
            'application/superdesk.item.graphic',
            'application/superdesk.item.video',
            'application/superdesk.item.audio',
            'text/html',
            'Files'
        ].indexOf(mediaType) !== -1;
        const supportsMedia = !readOnly && !singleLine && editorFormat.indexOf('media') !== -1;

        return supportsMedia && isValidMedia;
    }

    /**
     * @ngdoc method
     * @name Editor3#onDragOver
     * @returns {Boolean} Returns true if the item is not permitted.
     * @description Checks if the dragged over item is not allowed.
     */
    onDragOver(e) {
        return !this.allowItem(e);
    }

    /**
     * @ngdoc method
     * @name Editor3#onDragDrop
     * @description If item is allowed process drop action.
     */
    onDragDrop(e) {
        if (this.allowItem(e)) {
            // Firefox ignores the result of onDragOver and accept the item in all cases
            // Here will be tested again if the item is allowed

            this.props.dragDrop(e);
            return true;
        }

        return false;
    }

    keyBindingFn(e) {
        const {keyCode, shiftKey} = e;

        if (keyCode === 13 && shiftKey) {
            return 'soft-newline';
        }

        return getDefaultKeyBinding(e);
    }

    /**
     * @ngdoc method
     * @name Editor3#handleKeyCommand
     * @description Handles key commands in the editor.
     */
    handleKeyCommand(command) {
        const {editorState, onChange, singleLine} = this.props;

        if (singleLine && command === 'split-block') {
            return 'handled';
        }

        let newState;

        switch (command) {
        case 'soft-newline':
            newState = RichUtils.insertSoftNewline(editorState);
            break;
        case 'backspace': {
            // This is a workaround for un/ordered-list-item, when it is deleted an empty
            // ordered list(just 1. is shown) it will delete the previous block if it exists
            // (for example a table and then imediately after the ordered list)
            const selection = editorState.getSelection();
            const key = selection.getAnchorKey();
            const content = editorState.getCurrentContent();
            const block = content.getBlockForKey(key);
            const commands = ['unordered-list-item', 'ordered-list-item'];

            if (block.text === '' && commands.indexOf(block.type) !== -1) {
                newState = RichUtils.toggleBlockType(editorState, block.type);
                break;
            }
        }
        default:
            newState = RichUtils.handleKeyCommand(editorState, command);
        }

        if (newState) {
            onChange(newState);
            return 'handled';
        }

        return 'not-handled';
    }

    /**
     * @ngdoc method
     * @name Editor3#handleBeforeInput
     * @description Handles space characters before they are inputed. Makes sure that
     * any space character added after a link does not perpetuate the link. It basically
     * stops default DraftJS behavior, which is not quite suitable: when a link is added
     * at the end of content, any character added will continue to be part of the link.
     * This logic stops that behavior.
     */
    handleBeforeInput(chars) {
        if (chars !== ' ') {
            return false;
        }

        const {editorState, onChange} = this.props;
        const typeAfterCursor = getEntityTypeAfterCursor(editorState);
        const typeBeforeCursor = getEntityTypeBeforeCursor(editorState);
        const shouldBreakLink = typeAfterCursor !== 'LINK' && typeBeforeCursor === 'LINK';

        if (shouldBreakLink) {
            const contentState = editorState.getCurrentContent();
            const selection = editorState.getSelection();
            const newContentState = Modifier.insertText(contentState, selection, ' ');
            const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

            onChange(newEditorState);

            return true;
        }

        return false;
    }

    componentDidMount() {
        const $node = $(ReactDOM.findDOMNode(this));

        $node.on('dragover', this.onDragOver);
        $node.on('drop dragdrop', this.onDragDrop);

        // the editorKey is used to identify the source of pasted blocks
        this.editorKey = this.refs.editor._editorKey;
        this.editorNode = ReactDOM.findDOMNode(this.refs.editor);
    }

    render() {
        const {
            readOnly,
            locked,
            showToolbar,
            editorState,
            activeHighlight,
            onChange,
            onTab,
            highlightsEnabled,
            tabindex,
            scrollContainer
        } = this.props;
        const selection = editorState.getSelection();

        let cx = classNames({
            'Editor3-root Editor3-editor': true,
            'no-toolbar': !showToolbar,
            'read-only': readOnly
        });

        return (
            <div className={cx}>
                {showToolbar &&
                    <Toolbar
                        disabled={locked || readOnly}
                        scrollContainer={scrollContainer}
                        editorNode={this.editorNode}
                    />
                }
                {highlightsEnabled &&
                    <HighlightsPopup
                        highlight={activeHighlight}
                        editorNode={this.editorNode}
                        selection={selection}
                    />
                }
                <div className="focus-screen" onMouseDown={this.focus}>
                    <Editor editorState={editorState}
                        handleKeyCommand={this.handleKeyCommand}
                        keyBindingFn={this.keyBindingFn}
                        handleBeforeInput={this.handleBeforeInput}
                        blockRendererFn={blockRenderer}
                        customStyleMap={customStyleMap}
                        onChange={onChange}
                        onTab={onTab}
                        tabIndex={tabindex}
                        handlePastedText={handlePastedText.bind(this, this.editorKey)}
                        readOnly={locked || readOnly}
                        ref="editor"
                    />
                </div>
            </div>
        );
    }
}

Editor3Component.propTypes = {
    readOnly: PropTypes.bool,
    locked: PropTypes.bool,
    showToolbar: PropTypes.bool,
    highlightsEnabled: PropTypes.bool,
    editorState: PropTypes.object,
    activeHighlight: PropTypes.object,
    onChange: PropTypes.func,
    unlock: PropTypes.func,
    onTab: PropTypes.func,
    dragDrop: PropTypes.func,
    scrollContainer: PropTypes.string,
    singleLine: PropTypes.bool,
    editorFormat: PropTypes.array,
    tabindex: PropTypes.number
};

Editor3Component.defaultProps = {
    readOnly: false,
    singleLine: false,
    editorFormat: []
};

const mapStateToProps = (state) => ({
    readOnly: state.readOnly,
    showToolbar: state.showToolbar,
    highlightsEnabled: state.allowsHighlights,
    editorState: state.editorState,
    activeHighlight: state.activeHighlight,
    locked: state.locked,
    editorFormat: state.editorFormat,
    tabindex: state.tabindex
});

const mapDispatchToProps = (dispatch) => ({
    onChange: (editorState) => dispatch(actions.changeEditorState(editorState)),
    onTab: (e) => dispatch(actions.handleEditorTab(e)),
    dragDrop: (e) => dispatch(actions.dragDrop(e)),
    unlock: () => dispatch(actions.setLocked(false))
});

export const Editor3 = connect(mapStateToProps, mapDispatchToProps)(Editor3Component);
