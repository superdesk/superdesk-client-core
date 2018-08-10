import React, {Component} from 'react';
import {EditorState} from 'draft-js';
import {render, unmountComponentAtNode} from 'react-dom';
import PropTypes from 'prop-types';
import {Provider} from 'react-redux';
import {List} from 'immutable';

import {CommentPopup} from './comments';
import {SuggestionPopup} from './suggestions/SuggestionPopup';
import {AnnotationPopup} from './annotations';
import {suggestionsTypes} from '../highlightsConfig';
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
export class HighlightsPopup extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;
    static contextTypes: any;

    rendered: any;

    constructor(props) {
        super(props);

        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.createHighlight = this.createHighlight.bind(this);
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
        let data;

        if (this.styleBasedHighlightsExist()) {
            this.getInlineStyleForCollapsedSelection()
                .filter(this.props.highlightsManager.styleNameBelongsToHighlight)
                .forEach((styleName) => {
                    const highlightType = this.props.highlightsManager.getHighlightTypeFromStyleName(styleName);

                    if (suggestionsTypes.indexOf(highlightType) !== -1) {
                        data = Highlights.getSuggestionData(this.props.editorState, styleName);
                    } else {
                        data = this.props.highlightsManager.getHighlightData(styleName);
                    }

                    highlightsAndSuggestions = [
                        ...highlightsAndSuggestions,
                        {
                            type: highlightType,
                            value: data,
                            highlightId: styleName,
                        },
                    ];
                });
        }
        // We need to create a new provider here because this component gets rendered
        // outside the editor tree and loses context.
        return (
            <Provider store={store}>
                <div>
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
        if (type === 'ANNOTATION') {
            return (
                <AnnotationPopup
                    annotation={h}
                    highlightId={highlightId}
                    highlightsManager={this.props.highlightsManager}
                    editorNode={this.props.editorNode}
                />
            );
        } else if (type === 'COMMENT') {
            return (
                <CommentPopup
                    comment={h}
                    highlightId={highlightId}
                    highlightsManager={this.props.highlightsManager}
                    onChange={this.props.onChange}
                    editorState={this.props.editorState}
                    editorNode={this.props.editorNode}
                />
            );
        } else if (suggestionsTypes.indexOf(type) !== -1) {
            return (
                <SuggestionPopup
                    suggestion={h}
                    editorNode={this.props.editorNode}
                />
            );
        } else {
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
        // force unmount the existing component so it's rendered again instead of being updated
        // when updating there are issues with positioning caused by
        // not being to determine the position of selected text
        // which may or may not be related to the implementation of draftjs' getVisibleSelectionRect
        render(<div />, document.getElementById('react-placeholder'));

        render(this.component(), document.getElementById('react-placeholder'));
        document.addEventListener('click', this.onDocumentClick, {
            // required in order to prevent closing the popup when you click an element which is INSIDE the popup
            // but is being removed after clicking
            capture: true,
        });
        this.rendered = true;
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
        const onPopup = t.closest('.editor-popup').length || t.closest('.mentions-input__suggestions').length;
        const onEditor = t.closest(editorNode).length;
        const onModal = t.closest('.modal__dialog');

        if (!onPopup && !onEditor && !onModal) {
            // if the click occurred outside the editor, the popup and the modal, we close it
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
            return List();
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
