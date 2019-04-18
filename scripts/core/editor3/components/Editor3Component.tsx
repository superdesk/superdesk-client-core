import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {
    Editor,
    RichUtils,
    Modifier,
    EditorState,
    getDefaultKeyBinding,
    DefaultDraftBlockRenderMap,
    KeyBindingUtil,
} from 'draft-js';
import {getVisibleSelectionRect} from 'draft-js';

import {Map} from 'immutable';
import Toolbar from './toolbar';
import {getBlockRenderer} from './blockRenderer';
import {customStyleMap} from './customStyleMap';
import classNames from 'classnames';
import {handlePastedText} from './handlePastedText';
import {getEntityTypeAfterCursor, getEntityTypeBeforeCursor} from './links/entityUtils';
import {HighlightsPopup} from './HighlightsPopup';
import UnstyledBlock from './UnstyledBlock';
import UnstyledWrapper from './UnstyledWrapper';
import {handleBeforeInputHighlights} from '../helpers/handleBeforeInputHighlights';
import * as Suggestions from '../helpers/suggestions';
import {getCurrentAuthor} from '../helpers/author';
import {setSpellcheckerProgress, applySpellcheck} from '../actions';
import {noop} from 'lodash';
import {getSpellcheckWarningsByBlock} from './spellchecker/SpellcheckerDecorator';

const VALID_MEDIA_TYPES = [
    'application/superdesk.item.picture',
    'application/superdesk.item.graphic',
    'application/superdesk.item.video',
    'application/superdesk.item.audio',
    'text/uri-list',
    'text/html',
    'Files',
];

export const EDITOR_GLOBAL_REFS = 'editor3-refs';

/**
 * Get valid media type from event dataTransfer types
 *
 * Prefer superdesk media types
 *
 * @param {Event} event
 * @return {String}
 */
export function getValidMediaType(event) {
    return VALID_MEDIA_TYPES.find((mediaType) => event.dataTransfer.types.indexOf(mediaType) !== -1);
}

/**
    * @ngdoc method
    * @name Editor3#canDropMedia
    * @param {Object} e Event
    * @param {Array} editorConfig
    * @returns {Boolean} Returns true if the item is permitted.
    * @description Check if the editor accept images and if current item is valid media.
*/
export function canDropMedia(e, editorConfig) {
    const {editorFormat, readOnly, singleLine} = editorConfig;
    const isValidMedia = !!getValidMediaType(e.originalEvent);
    const supportsMedia = !readOnly && !singleLine && editorFormat.indexOf('media') !== -1;

    return supportsMedia && isValidMedia;
}

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
export class Editor3Component extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    editorKey: any;
    editorNode: any;
    div: any;
    editor: any;
    spellcheckCancelFn: () => void;

    constructor(props) {
        super(props);

        this.editorKey = null;
        this.editorNode = undefined;

        this.focus = this.focus.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.handleBeforeInput = this.handleBeforeInput.bind(this);
        this.keyBindingFn = this.keyBindingFn.bind(this);
        this.spellcheck = this.spellcheck.bind(this);
        this.spellcheckCancelFn = noop;
    }

    /**
     * @ngdoc method
     * @name Editor3#focus
     * @description Handle the editor get focus event
     */
    focus() {
        this.props.unlock();
    }

    spellcheck() {
        if (this.props.spellchecking.enabled !== true) {
            return;
        }

        this.spellcheckCancelFn();

        this.spellcheckCancelFn = (() => {
            let canceled = false;

            setTimeout(() => {
                if (!canceled) {
                    if (this.props.spellchecking.inProgress !== true) {
                        this.props.dispatch(setSpellcheckerProgress(true));
                    }

                    getSpellcheckWarningsByBlock(this.props.editorState).then((spellcheckWarningsByBlock) => {
                        if (!canceled) {
                            this.props.dispatch(applySpellcheck(spellcheckWarningsByBlock));
                            this.spellcheckCancelFn = noop;
                        }
                    });
                }
            }, 500);

            return () => canceled = true;
        })();
    }

    /**
     * @ngdoc method
     * @name Editor3#onDragOver
     * @returns {Boolean} Returns true if the item is not permitted.
     * @description Checks if the dragged over item is not allowed.
     */
    onDragOver(e) {
        return !canDropMedia(e, this.props);
    }

    keyBindingFn(e) {
        const {keyCode, shiftKey} = e;

        if (keyCode === 13 && shiftKey) {
            return 'soft-newline';
        }

        // ctrl + X
        if (keyCode === 88 && KeyBindingUtil.hasCommandModifier(e)) {
            const {editorState} = this.props;
            const selection = editorState.getSelection();

            if (!selection.isCollapsed()) {
                document.execCommand('copy'); // add selected text to clipboard
                return 'delete';
            }
        }

        if (KeyBindingUtil.hasCommandModifier(e)) {
            const {editorFormat} = this.props;
            const notAllowBold = keyCode === 66 && editorFormat.indexOf('bold') === -1;
            const notAllowItalic = keyCode === 73 && editorFormat.indexOf('italic') === -1;
            const notAllowUnderline = keyCode === 85 && editorFormat.indexOf('underline') === -1;

            if (notAllowBold || notAllowItalic || notAllowUnderline) {
                e.preventDefault();
                return '';
            }
        }

        return getDefaultKeyBinding(e);
    }

    /**
     * @ngdoc method
     * @name Editor3#handleKeyCommand
     * @description Handles key commands in the editor.
     */
    handleKeyCommand(command) {
        const author = getCurrentAuthor();
        const {editorState, onChange, singleLine, suggestingMode} = this.props;
        const {
            onCreateSplitParagraphSuggestion,
            onCreateDeleteSuggestion,
            onCreateChangeStyleSuggestion,
        } = this.props;

        if (singleLine && command === 'split-block') {
            return 'handled';
        }

        let newState;

        switch (command) {
        case 'bold':
        case 'italic':
        case 'underline':
            if (suggestingMode) {
                // prevent to change other user suggestion
                if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)
                    && !Suggestions.allowEditSuggestionOnRight(editorState, author)) {
                    return 'handled';
                }

                const style = command.toUpperCase();
                const inlineStyles = editorState.getCurrentInlineStyle();
                const active = inlineStyles.has(style);

                onCreateChangeStyleSuggestion(style, active);
                return 'handled';
            }

            newState = RichUtils.handleKeyCommand(editorState, command);
            break;
        case 'soft-newline':
            newState = RichUtils.insertSoftNewline(editorState);
            break;
        case 'split-block':
            if (suggestingMode) {
                // prevent to change other user suggestion
                if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)
                    && !Suggestions.allowEditSuggestionOnRight(editorState, author)) {
                    return 'handled';
                }

                onCreateSplitParagraphSuggestion();
                return 'handled';
            }

            newState = RichUtils.handleKeyCommand(editorState, command);
            break;
        case 'delete':
            if (suggestingMode) {
                // prevent to change other user suggestion that is after current position
                if (!Suggestions.allowEditSuggestionOnRight(editorState, author)) {
                    return 'handled';
                }

                onCreateDeleteSuggestion('delete');
                return 'handled';
            }

            newState = RichUtils.handleKeyCommand(editorState, command);
            break;
        case 'secondary-paste': // this is blocking redo on non-windows systems, should be osx specific
            newState = EditorState.redo(editorState);
            break;
        case 'backspace': {
            if (suggestingMode) {
                // prevent to change other user suggestion that is before current position
                if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)) {
                    return 'handled';
                }

                onCreateDeleteSuggestion('backspace');
                return 'handled';
            }

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
        } // fall through
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
    handleBeforeInput(chars, editorState) {
        const author = getCurrentAuthor();
        const {onChange, suggestingMode, onCreateAddSuggestion} = this.props;

        if (suggestingMode) {
            if (!Suggestions.allowEditSuggestionOnLeft(editorState, author)
                && !Suggestions.allowEditSuggestionOnRight(editorState, author)) {
                return 'handled';
            }

            onCreateAddSuggestion(chars);
            return 'handled';
        }

        if (handleBeforeInputHighlights(this.props.onChange, chars, editorState) === 'handled') {
            return 'handled';
        }

        if (chars !== ' ') {
            return 'not-handled';
        }

        const typeAfterCursor = getEntityTypeAfterCursor(editorState);
        const typeBeforeCursor = getEntityTypeBeforeCursor(editorState);
        const shouldBreakLink = typeAfterCursor !== 'LINK' && typeBeforeCursor === 'LINK';

        if (shouldBreakLink) {
            const contentState = editorState.getCurrentContent();
            const selection = editorState.getSelection();
            const newContentState = Modifier.insertText(contentState, selection, ' ');
            const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

            onChange(newEditorState);

            return 'handled';
        }

        return 'not-handled';
    }

    componentDidMount() {
        $(this.div).on('dragover', this.onDragOver);

        if (!window[EDITOR_GLOBAL_REFS]) {
            window[EDITOR_GLOBAL_REFS] = {};
        }

        window[EDITOR_GLOBAL_REFS][this.editorKey] = this.editor;

        this.spellcheck();
    }

    handleRefs(editor) {
        this.editor = editor;

        this.editorKey = this.editor === null ? null : this.editor._editorKey;
        this.editorNode = this.editor === null ? undefined : ReactDOM.findDOMNode(this.editor);
    }

    componentWillUnmount() {
        $(this.div).off();

        delete window[EDITOR_GLOBAL_REFS][this.editorKey];
    }

    componentDidUpdate(prevProps) {
        if (window.hasOwnProperty('instgrm')) {
            window.instgrm.Embeds.process();
        }

        if (prevProps.editorState.getCurrentContent() !== this.props.editorState.getCurrentContent()) {
            this.spellcheck();
        }
    }
    render() {
        const {
            readOnly,
            locked,
            showToolbar,
            editorState,
            onChange,
            onTab,
            tabindex,
            scrollContainer,
        } = this.props;

        const cx = classNames({
            'Editor3-root Editor3-editor': true,
            'no-toolbar': !showToolbar,
            'read-only': readOnly,
            'unstyled__block--invisibles': this.props.invisibles,
        });

        const mediaEnabled = this.props.editorFormat.indexOf('media') !== -1;

        const blockRenderMap = DefaultDraftBlockRenderMap.merge(Map(
            mediaEnabled ? {
                unstyled: {
                    element: UnstyledBlock,
                    aliasedElements: ['p'],
                    wrapper: <UnstyledWrapper dispatch={this.props.dispatch} editorProps={this.props} />,
                },
            } : {},
        ));

        return (
            <div className={cx} ref={(div) => this.div = div}>
                {showToolbar &&
                    <Toolbar
                        disabled={locked || readOnly}
                        scrollContainer={scrollContainer}
                        editorNode={this.editorNode}
                        highlightsManager={this.props.highlightsManager}
                        editorWrapperElement={this.div}
                    />
                }
                <HighlightsPopup
                    editorNode={this.editorNode}
                    editorState={editorState}
                    highlightsManager={this.props.highlightsManager}
                    onChange={this.props.onChange}
                />
                <div className="focus-screen" onMouseDown={this.focus}>
                    <Editor editorState={editorState}
                        handleKeyCommand={this.handleKeyCommand}
                        keyBindingFn={this.keyBindingFn}
                        handleBeforeInput={this.handleBeforeInput}
                        blockRenderMap={blockRenderMap}
                        blockRendererFn={getBlockRenderer({svc: this.props.svc})}
                        customStyleMap={{...customStyleMap, ...this.props.highlightsManager.styleMap}}
                        onChange={(editorStateNext) => {
                            // in order to position the popup component we need to know the position of editor selection
                            // even when it's not focused, or another input is focused

                            const selectionRect = getVisibleSelectionRect(window);

                            if (this.editorNode != null && selectionRect != null) {
                                this.editorNode.dataset.editorSelectionRect = JSON.stringify(selectionRect);
                            }

                            onChange(editorStateNext);
                        }}
                        onTab={onTab}
                        tabIndex={tabindex}
                        handlePastedText={handlePastedText.bind(this)}
                        readOnly={locked || readOnly}
                        ref={(editor) => this.handleRefs(editor)}
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
    editorState: PropTypes.object,
    onChange: PropTypes.func,
    unlock: PropTypes.func,
    onTab: PropTypes.func,
    dragDrop: PropTypes.func,
    scrollContainer: PropTypes.string.isRequired,
    singleLine: PropTypes.bool,
    editorFormat: PropTypes.array,
    tabindex: PropTypes.number,
    dispatch: PropTypes.func,
    suggestingMode: PropTypes.bool,
    onCreateAddSuggestion: PropTypes.func,
    onCreateDeleteSuggestion: PropTypes.func,
    onPasteFromSuggestingMode: PropTypes.func,
    onCreateSplitParagraphSuggestion: PropTypes.func,
    onCreateChangeStyleSuggestion: PropTypes.func,
    svc: PropTypes.object,
    invisibles: PropTypes.bool,
    highlights: PropTypes.object,
    highlightsManager: PropTypes.object,
};

Editor3Component.defaultProps = {
    readOnly: false,
    singleLine: false,
    editorFormat: [],
};
