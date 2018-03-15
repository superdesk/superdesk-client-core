import React, {Component} from 'react';
import {getVisibleSelectionRect, EditorState} from 'draft-js';
import {render, unmountComponentAtNode} from 'react-dom';
import PropTypes from 'prop-types';
import {Provider} from 'react-redux';
import {List} from 'immutable';

import {Dropdown} from 'core/ui/components';
import {CommentPopup} from './comments';
import {SuggestionPopup} from './suggestions/SuggestionPopup';
import {AnnotationPopup} from './annotations';
import {allSuggestionsTypes} from '../highlightsConfig';
import * as Highlights from '../helpers/highlights';

/**
 * @ngdoc react
 * @name HighlightsPopup
 * @description HighlightsPopup is a popup showing information about the highlight
 * that the cursor is on. Based on the highlight type, it renders the appropriate
 * component. Check the component() method for more information. HighlightsPopup
 * also handles positioning the popup relative to the editor's position and hiding
 * it when a user clicks outside the editor/popup context.
 */
export class HighlightsPopup extends Component {
    constructor(props) {
        super(props);

        this.lastTop = 150;

        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.createHighlight = this.createHighlight.bind(this);
        this.setHighlightsElelemtRef = this.setHighlightsElelemtRef.bind(this);
    }

    position() {
        const viewportHeight = $(window).innerHeight();
        const popupHeight = $(this.highlightEl).innerHeight();
        const selectionRect = getVisibleSelectionRect(window);
        const bottomBarHeight = $('.opened-articles').innerHeight();

        const enoughSpaceAtTheBottom = viewportHeight - selectionRect.bottom - bottomBarHeight > popupHeight;

        if (enoughSpaceAtTheBottom) {
            this.highlightEl.style.top = selectionRect.top + 'px';
        } else {
            this.highlightEl.style.top = (selectionRect.bottom - popupHeight) + 'px';
        }

        this.highlightEl.style.left = (this.props.editorNode.getBoundingClientRect().left - 360) + 'px';
    }

    setHighlightsElelemtRef(ref) {
        this.highlightEl = ref;
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#component
     * @description component returns the popup element to be rendered.
     * @returns {JSX}
     */
    component() {
        const {store} = this.context;
        let highlightsAndSuggestions = [];

        if (this.styleBasedHighlightsExist()) {
            this.getInlineStyleForCollapsedSelection()
                .filter(this.props.highlightsManager.styleNameBelongsToHighlight)
                .forEach((styleName) => {
                    const highlightType = this.props.highlightsManager.getHighlightTypeFromStyleName(styleName);
                    let data = this.props.highlightsManager.getHighlightData(styleName);

                    if (allSuggestionsTypes.indexOf(highlightType) !== -1) {
                        const {selection, highlightedText} = Highlights.getRangeAndTextForStyle(
                            this.props.editorState, styleName
                        );

                        data = {
                            ...data,
                            suggestionText: highlightedText,
                            selection: selection,
                            styleName: styleName
                        };
                    }

                    highlightsAndSuggestions = [
                        ...highlightsAndSuggestions,
                        {
                            type: highlightType,
                            value: data,
                            highlightId: styleName
                        }
                    ];
                });
        }
        // We need to create a new provider here because this component gets rendered
        // outside the editor tree and loses context.
        return (
            <Provider store={store}>
                <div className="highlights-popup" ref={this.setHighlightsElelemtRef}>
                    {
                        highlightsAndSuggestions
                            .map((obj, i) => (
                                <div key={i}>
                                    {this.createHighlight(obj.type, obj.value, obj.highlightId)}
                                </div>
                            ))
                    }
                </div>
            </Provider>
        );
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#createHighlight
     * @param {String} type Highlight Type
     * @description Renders the active highlight of the given type
     * @returns {JSX}
     */
    createHighlight(type, h, highlightId) {
        switch (type) {
        case 'ANNOTATION':
            return (
                <Dropdown open={true}>
                    <AnnotationPopup
                        annotation={h}
                        highlightId={highlightId}
                        highlightsManager={this.props.highlightsManager}
                    />
                </Dropdown>
            );
        case 'COMMENT':
            return (
                <Dropdown open={true}>
                    <CommentPopup
                        comment={h}
                        highlightId={highlightId}
                        highlightsManager={this.props.highlightsManager}
                        onChange={this.props.onChange}
                        editorState={this.props.editorState}
                    />
                </Dropdown>
            );
        case 'TOGGLE_BOLD_SUGGESTION':
        case 'TOGGLE_ITALIC_SUGGESTION':
        case 'TOGGLE_UNDERLINE_SUGGESTION':
        case 'DELETE_SUGGESTION':
        case 'ADD_SUGGESTION':
            return <SuggestionPopup suggestion={h} />;
        default:
            console.error('Invalid highlight type in HighlightsPopup.jsx: ', type);
        }
    }

    styleBasedHighlightsExist() {
        return this.getInlineStyleForCollapsedSelection()
            .some(this.props.highlightsManager.styleNameBelongsToHighlight);
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#renderCustom
     * @description Renders the popup into the app's React popup placeholder
     * and creates a document click handler which will hide the popup when
     * clicks occur outside of it.
     */
    renderCustom() {
        render(this.component(), document.getElementById('react-placeholder'));
        document.addEventListener('click', this.onDocumentClick);
        this.rendered = true;

        this.position();
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#unmountCustom
     * @description Unmounts the popup.
     */
    unmountCustom() {
        unmountComponentAtNode(document.getElementById('react-placeholder'));
        document.removeEventListener('click', this.onDocumentClick);
        this.rendered = false;
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#onDocumentClick
     * @param {Event} e
     * @description Triggered when the document is clicked. It checks if the click
     * occurred on the popup or on the editor, and if it didn't, it unmounts the
     * component.
     */
    onDocumentClick(e) {
        const t = $(e.target);
        const {editorNode} = this.props;
        const onPopup = t.closest('.highlights-popup').length || t.closest('.mentions-input__suggestions').length;
        const onEditor = t.closest(editorNode).length;

        if (!onPopup && !onEditor) {
            // if the click occurred outside the editor and the popup we close it
            this.unmountCustom();
        }
    }

    shouldComponentUpdate(nextProps) {
        const nextSelection = nextProps.editorState.getSelection();
        const selection = this.props.editorState.getSelection();
        const hadHighlightsChanged = this.props.highlightsManager.hadHighlightsChanged(
            this.props.editorState, nextProps.editorState);

        var cursorMoved = nextSelection.getAnchorOffset() !== selection.getAnchorOffset() ||
            nextSelection.getAnchorKey() !== selection.getAnchorKey();

        return cursorMoved || hadHighlightsChanged;
    }

    getInlineStyleForCollapsedSelection() {
        const {editorState} = this.props;
        const selection = editorState.getSelection();
        const content = editorState.getCurrentContent();

        if (selection.isCollapsed() === false) {
            return List();
        }

        const blockKey = selection.getStartKey();
        let block = content.getBlockForKey(blockKey);
        let offset = selection.getStartOffset();

        if (block.getLength() === offset) {
            const nextBlock = content.getBlockAfter(block.getKey());

            if (nextBlock == null) {
                return List();
            }

            block = nextBlock;
            offset = 0;
        }

        var inlineStyle = block.getInlineStyleAt(offset);

        return inlineStyle;
    }

    shouldRender() {
        if (this.styleBasedHighlightsExist()) {
            return true;
        }

        return false;
    }
    componentDidUpdate() {
        // Waiting one cycle allows the selection to be rendered in the browser
        // so that we can correctly retrieve its position.
        setTimeout(() => this.shouldRender() ? this.renderCustom() : this.unmountCustom(), 0);
    }

    componentWillUnmount() {
        if (this.rendered) {
            this.unmountCustom();
        }
    }

    render() {
        return null;
    }
}

HighlightsPopup.contextTypes = {
    store: PropTypes.object,
};

HighlightsPopup.propTypes = {
    editorState: PropTypes.instanceOf(EditorState),
    editorNode: PropTypes.object,
    highlightsManager: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};
