import React from 'react';
import ReactDOM from 'react-dom';
import {
    Editor,
    RichUtils,
    Modifier,
    EditorState,
    getDefaultKeyBinding,
    DefaultDraftBlockRenderMap,
    KeyBindingUtil,
    SelectionState,
    DraftDragType,
    DraftHandleValue,
} from 'draft-js';
import {getVisibleSelectionRect} from 'draft-js';

import {Map} from 'immutable';
import Toolbar from './toolbar';
import {blockRenderer} from './blockRenderer';
import {customStyleMap} from './customStyleMap';
import classNames from 'classnames';
import {handlePastedText} from './handlePastedText';
import {getEntityTypeAfterCursor, getEntityTypeBeforeCursor} from './links/entityUtils';
import {HighlightsPopup} from './HighlightsPopup';
import UnstyledBlock from './UnstyledBlock';
import UnstyledWrapper from './UnstyledWrapper';
import * as Suggestions from '../helpers/suggestions';
import {getCurrentAuthor} from '../helpers/author';
import {setSpellcheckerProgress, applySpellcheck, PopupTypes} from '../actions';
import {noop} from 'lodash';
import {getSpellcheckWarningsByBlock} from './spellchecker/SpellcheckerDecorator';
import {getSpellchecker} from './spellchecker/default-spellcheckers';
import {IEditorStore} from '../store';
import {appConfig} from 'appConfig';
import {EDITOR_BLOCK_TYPE, MIME_TYPE_SUPERDESK_TEXT_ITEM} from '../constants';
import {IEditorComponentProps, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {preventInputWhenLimitIsPassed} from '../helpers/characters-limit';
import {handleBeforeInputHighlights} from '../helpers/handleBeforeInputHighlights';
import {CharacterLimitUiBehavior} from 'apps/authoring/authoring/components/CharacterCountConfigButton';
import {Editor3Autocomplete} from './Editor3Autocomplete';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import {MEDIA_TYPES_TRIGGER_DROP_ZONE} from 'core/constants';
import {isMacOS} from 'core/utils';
import {canAddArticleEmbed} from './article-embed/can-add-article-embed';

export const EVENT_TYPES_TRIGGER_DROP_ZONE = [
    ...MEDIA_TYPES_TRIGGER_DROP_ZONE,
    EDITOR_BLOCK_TYPE,
    'Files',
    MIME_TYPE_SUPERDESK_TEXT_ITEM,
];

const VALID_MEDIA_TYPES = [
    ...MEDIA_TYPES_TRIGGER_DROP_ZONE,
    'text/uri-list',
    'text/html',
    'Files',
];

export const EDITOR_GLOBAL_REFS = 'editor3-refs';
const editor3AutocompleteClassName = 'editor3-autocomplete';

/**
 * Get valid media type from event dataTransfer types
 *
 * Prefer superdesk media types
 *
 * @param {Event} event
 * @return {String}
 */
export function getValidMediaType(event) {
    return VALID_MEDIA_TYPES.find((mediaType) => event.dataTransfer.types.includes(mediaType));
}

// caret position isn't displayed if a boolean is returned while dragging text
export function canDropMedia(e, editorConfig): undefined | boolean {
    // apply restrictions only if it is something other than text(IArticle object, image file) being dragged
    if ((e?.originalEvent?.dataTransfer?.types ?? []).some((type) => type !== 'text/plain' && type !== 'text/html')) {
        const {editorFormat, readOnly, singleLine} = editorConfig;
        const supportsMedia = !readOnly && !singleLine && editorFormat.includes('media');

        if (!supportsMedia) {
            return false;
        }

        const mediaType = getValidMediaType(e.originalEvent);
        const dataTransfer = e.originalEvent.dataTransfer;
        let isValidMedia = !!mediaType;

        if (mediaType === 'Files' && dataTransfer.files.length > 0) {
            // checks if files dropped from external folder are valid or not
            const isValidFileType = Object.values(dataTransfer.files).every(
                (file: File) => file.type.startsWith('audio/')
                || file.type.startsWith('image/') || file.type.startsWith('video/'));

            if (!isValidFileType) {
                return false;
            }
        }

        return isValidMedia;
    }
}

export interface IPropsEditor3Component {
    readOnly?: boolean;
    locked?: boolean;
    loading?: boolean;
    showToolbar?: boolean;
    editorState?: EditorState;
    scrollContainer?: string;
    singleLine?: boolean;
    plainText?: boolean;
    editorFormat?: Array<RICH_FORMATTING_OPTION>;
    tabindex?: number;
    suggestingMode?: boolean;
    svc?: any;
    invisibles?: boolean;
    highlights?: any;
    highlightsManager?: any;
    spellchecking?: IEditorStore['spellchecking'];
    cleanPastedHtml?: boolean;
    limit?: number;
    limitBehavior?: CharacterLimitUiBehavior;
    autocompleteSuggestions?: Array<string>;
    onCreateAddSuggestion?(chars): void;
    onCreateDeleteSuggestion?(type): void;
    onPasteFromSuggestingMode?(): void;
    onCreateSplitParagraphSuggestion?(): void;
    onCreateChangeStyleSuggestion?(style, active): void;
    onChange?(editorState: EditorState): void;
    unlock?(): void;
    onTab?(event): void;
    dragDrop?(): void;
    dispatch?(action: any): void;
    canAddArticleEmbed?: (srcId: string) => Promise<typeof canAddArticleEmbed>;
    uiTheme?: IEditorComponentProps<unknown, unknown, unknown>['uiTheme'];
    showPopup?(type: any, data: any): void;
}

interface IState {
    draggingInProgress: boolean;

    /**
     * Only content changes are tracked (addition/removal of chars, whitespace).
     * Metadata changes(styles, entities) are not tracked.
     */
    contentChangesAfterLastFocus: number;
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
export class Editor3Component extends React.Component<IPropsEditor3Component, IState> {
    static propTypes: any;
    static defaultProps: any;

    editorKey: any;

    // Use an object otherwise a second render will be required after mounting
    // to use this reference in a render property to a component.
    editorNode: React.MutableRefObject<HTMLDivElement>;

    div: any;
    editor: any;
    spellcheckCancelFn: () => void;
    onDragEnd: () => void;
    removeListeners: Array<() => void> = [];

    constructor(props) {
        super(props);

        this.editorKey = null;
        this.editorNode = React.createRef();

        this.focus = this.focus.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.handleBeforeInput = this.handleBeforeInput.bind(this);
        this.keyBindingFn = this.keyBindingFn.bind(this);
        this.handleDropOnEditor = this.handleDropOnEditor.bind(this);
        this.spellcheck = this.spellcheck.bind(this);
        this.spellcheckCancelFn = noop;

        this.onDragEnd = () => {
            if (this.state.draggingInProgress !== false) {
                this.setState({draggingInProgress: false});
            }
        };

        this.state = {
            draggingInProgress: false,
            contentChangesAfterLastFocus: 0,
        };
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
        this.spellcheckCancelFn();

        this.spellcheckCancelFn = (() => {
            let canceled = false;

            setTimeout(() => {
                if (!canceled) {
                    if (this.props.spellchecking.inProgress !== true) {
                        this.props.dispatch(setSpellcheckerProgress(true));
                    }

                    const spellchecker = getSpellchecker(this.props.spellchecking.language);

                    if (spellchecker == null) {
                        return;
                    }

                    getSpellcheckWarningsByBlock(spellchecker, this.props.editorState)
                        .then((spellcheckWarningsByBlock) => {
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

    handleDropOnEditor(selection: SelectionState, dataTransfer: any, isInternal: DraftDragType): DraftHandleValue {
        this.onDragEnd();

        if (isInternal) {
            const {editorState} = this.props;
            const targetBlockKey = selection.getStartKey();
            const block = editorState.getCurrentContent().getBlockForKey(targetBlockKey);

            if (block && block.getType() === 'atomic') {
                // Avoid dragging internal text inside an atomic block.
                // Draft will replace the block data with the text, which
                // will break the block until page refresh
                return 'handled';
            }
        }
    }

    keyBindingFn(e) {
        const {key, shiftKey, ctrlKey, metaKey} = e;
        const selectionState = this.props.editorState.getSelection();
        const modifierKey = isMacOS() ? metaKey : ctrlKey;

        if (
            key === 'k'
            && modifierKey
            && this.props.editorFormat.includes('link')
            && selectionState.isCollapsed() !== true
        ) {
            this.props.showPopup(PopupTypes.Link, selectionState);
            e.preventDefault();
            return '';
        }

        if (key === 'ArrowDown' || key === 'ArrowUp') {
            const autocompleteEl = document.querySelector(`.${editor3AutocompleteClassName}`) as HTMLElement | null;

            if (autocompleteEl != null) {
                autocompleteEl.focus();
                e.preventDefault();
                return '';
            }
        }

        if (key === 'Enter' && shiftKey) {
            return 'soft-newline';
        }

        if (key === 'Tab') {
            this.props.onTab(e);
            return '';
        }

        // ctrl + X
        if (key === 'x' && KeyBindingUtil.hasCommandModifier(e)) {
            if (!selectionState.isCollapsed()) {
                document.execCommand('copy'); // add selected text to clipboard
                return 'delete';
            }
        }

        if (KeyBindingUtil.hasCommandModifier(e)) {
            const {editorFormat} = this.props;
            const notAllowBold = key === 'b' && editorFormat.indexOf('bold') === -1;
            const notAllowItalic = key === 'i' && editorFormat.indexOf('italic') === -1;
            const notAllowUnderline = key === 'u' && editorFormat.indexOf('underline') === -1;

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
            this.setState({contentChangesAfterLastFocus: this.state.contentChangesAfterLastFocus + 1});

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

            if (block.getText() === '' && commands.indexOf(block.getType()) !== -1) {
                newState = RichUtils.toggleBlockType(editorState, block.getType());
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
    handleBeforeInput(chars: string, editorState: EditorState) {
        this.setState({contentChangesAfterLastFocus: this.state.contentChangesAfterLastFocus + 1});

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

        if (this.props.limit && this.props.limitBehavior === 'limit') {
            if (preventInputWhenLimitIsPassed(editorState, chars, this.props.limit)) {
                return 'handled';
            }
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

        if (appConfig.features.showCharacterLimit) {
            document.documentElement.style.
                setProperty('--preCharacterLimit', appConfig.features.showCharacterLimit + 'ch');
        }

        if (this.props.spellchecking.enabled) {
            this.spellcheck();
        }
    }

    handleRefs(editor) {
        this.editor = editor;

        this.editorKey = this.editor === null ? null : this.editor._editorKey;

        // eslint-disable-next-line react/no-find-dom-node
        this.editorNode.current = this.editor === null ?
            undefined :
            // eslint-disable-next-line react/no-find-dom-node
            ReactDOM.findDOMNode(this.editor) as HTMLDivElement;
    }

    componentWillUnmount() {
        $(this.div).off();

        delete window[EDITOR_GLOBAL_REFS][this.editorKey];
    }

    componentDidUpdate(prevProps) {
        if (window.hasOwnProperty('instgrm')) {
            window.instgrm.Embeds.process();
        }

        if (
            this.props.spellchecking.enabled &&
            prevProps.editorState.getCurrentContent() !== this.props.editorState.getCurrentContent()
        ) {
            this.spellcheck();
        }
    }

    render() {
        const {
            readOnly,
            locked,
            showToolbar,
            onChange,
            tabindex,
            scrollContainer,
            cleanPastedHtml,
            editorState,
        } = this.props;

        const cx = classNames({
            'Editor3-root Editor3-editor': true,
            /**
                There is global theming and article-edit specific one.
                When inside article-edit we always pass a theme,
                otherwise we want to use Editor3-single-line-style for global theme styling.
            */
            'Editor3-single-line-style': this.props.singleLine === true || this.props.uiTheme == null,
            'no-toolbar': !showToolbar,
            'read-only': readOnly,
            'unstyled__block--invisibles': this.props.invisibles,
        });

        /**
         * INFO: I can't remember exactly, but I think this was done for performance reasons
         * so if nothing can be dropped(based on config), we don't even replace rendering of unstyled blocks
         * to listen for drop events.
         * I've briefly looked at the component we're supplying for replacement and it doesn't look like it would
         * add much performance overhead if it was replaced unconditionally, but I don't want to break it
         * nor spend time on testing so I'm keeping it as is for now.
         */
        const dropAreaEnabled =
            this.props.editorFormat.includes('media') || this.props.editorFormat.includes('embed articles');

        const blockRenderMap = DefaultDraftBlockRenderMap.merge(Map(
            dropAreaEnabled ? {
                unstyled: {
                    element: UnstyledBlock,
                    aliasedElements: ['p'],
                    wrapper: <UnstyledWrapper dispatch={this.props.dispatch} editorProps={this.props} />,
                },
            } : {},
        ));

        const blockStyle = (contentBlock): string => {
            const type = contentBlock.getType();

            if (type === 'code-block' && appConfig.features.showCharacterLimit) {
                return 'showCharacterLimit';
            }
        };

        return (
            <div
                className={cx}
                ref={(div) => this.div = div}
                onDragStart={() => {
                    if (this.state.draggingInProgress !== true) {
                        setTimeout(() => {
                            // known issue: dragging text doesn't work when the top of the editor is in the viewport
                            // https://github.com/facebook/draft-js/issues/2218
                            // it's not clear why, but using setTimeout seems to work around the issue

                            this.setState({draggingInProgress: true});
                        });
                    }
                }}
                data-test-id="editor3"

                // "dragend" event won't fire if an item is dropped inside draft-js field
                // it's handled there separately
                onDragEnd={this.onDragEnd}
                onFocus={() => {
                    this.setState({contentChangesAfterLastFocus: 0});
                }}
                style={
                    this.props.uiTheme == null
                        ? undefined
                        : {
                            borderColor: this.props.uiTheme.backgroundColorSecondary,
                        }
                }
            >
                {
                    showToolbar && this.state.draggingInProgress !== true
                        ? (
                            <Toolbar
                                uiTheme={this.props.uiTheme}
                                disabled={locked || readOnly}
                                scrollContainer={scrollContainer}
                                editorNode={this.editorNode}
                                highlightsManager={this.props.highlightsManager}
                                editorWrapperElement={this.div}
                            />
                        )
                        : null
                }
                <HighlightsPopup
                    editorNode={this.editorNode}
                    editorState={editorState}
                    highlightsManager={this.props.highlightsManager}
                    onChange={this.props.onChange}
                />
                <div
                    className="focus-screen"
                    onMouseDown={this.focus}
                    style={
                        this.props.uiTheme == null
                            ? {}
                            : {
                                fontSize: this.props.uiTheme.fontSize,
                                color: this.props.uiTheme.textColor,
                                fontFamily: this.props.uiTheme.fontFamily,
                            }
                    }
                >
                    <Editor
                        editorState={editorState}
                        handleDrop={this.handleDropOnEditor}
                        handleKeyCommand={this.handleKeyCommand}
                        keyBindingFn={this.keyBindingFn}
                        handleBeforeInput={this.handleBeforeInput}
                        blockRenderMap={blockRenderMap}
                        blockRendererFn={blockRenderer}
                        blockStyleFn={blockStyle}
                        customStyleMap={{...customStyleMap, ...this.props.highlightsManager.styleMap}}
                        onChange={(editorStateNext: EditorState) => {
                            // in order to position the popup component we need to know the position of editor selection
                            // even when it's not focused, or another input is focused

                            const selectionRect = getVisibleSelectionRect(window);

                            if (this.editorNode?.current != null && selectionRect != null) {
                                this.editorNode.current.dataset.editorSelectionRect = JSON.stringify(selectionRect);
                            }

                            onChange(editorStateNext);
                        }}
                        tabIndex={tabindex}
                        handlePastedText={handlePastedText.bind(this)}
                        readOnly={locked || readOnly}
                        ref={(editor) => this.handleRefs(editor)}
                        spellCheck={appConfig.editor3.browserSpellCheck}
                        stripPastedStyles={cleanPastedHtml}
                        onBlur={(event: any) => {
                            if (
                                event?.relatedTarget == null
                                || querySelectorParent(
                                    event.relatedTarget,
                                    `.${editor3AutocompleteClassName}`,
                                    {self: true},
                                ) == null
                            ) { // check whether focus went to autocomplete or to an item inside it
                                this.setState({contentChangesAfterLastFocus: 0});
                            }
                        }}
                    />

                    {
                        this.state.contentChangesAfterLastFocus > 0 && (
                            <Editor3Autocomplete
                                editorState={editorState}
                                editorNode={this.editorNode.current}
                                dispatch={this.props.dispatch}
                                autocompleteSuggestions={this.props.autocompleteSuggestions}
                                className={editor3AutocompleteClassName}
                            />
                        )
                    }

                    {this.props.loading && <div className="loading-overlay active" />}
                </div>
            </div>
        );
    }
}

Editor3Component.defaultProps = {
    readOnly: false,
    singleLine: false,
    plainText: false,
    cleanPastedHtml: false,
    editorFormat: [],
};
