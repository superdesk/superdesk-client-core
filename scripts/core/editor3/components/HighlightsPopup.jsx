import React, {Component} from 'react';
import {getVisibleSelectionRect, SelectionState} from 'draft-js';
import {render, unmountComponentAtNode} from 'react-dom';
import PropTypes from 'prop-types';
import {Provider} from 'react-redux';

import {Dropdown} from 'core/ui/components';
import {CommentPopup} from './comments';
import {AnnotationPopup} from './annotations';

// topPadding holds the number of pixels between the selection and the top side
// of the popup.
const topPadding = 50;

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
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#position
     * @description position returns the absolute top and left position that the popup
     * needs to be displayed at, with regards to the current selection.
     * @returns {Object} Object containing top and left in pixels.
     */
    position() {
        const {left: editorLeft} = this.props.editorNode.getBoundingClientRect();
        const rect = getVisibleSelectionRect(window);

        let top = 150;
        let left = editorLeft - 260;

        if (rect === null || rect.top === 0 && rect.left === 0) {
            // special case, happens when editor is out of focus,
            // so we just reuse whatever the last value was.
            top = this.lastTop;
        } else {
            top = rect.top - topPadding;
        }

        this.lastTop = top; // if we lose rect, keep this for next time.

        return {top, left};
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#component
     * @description component returns the popup element to be rendered.
     * @returns {JSX}
     */
    component() {
        const {highlight} = this.props;
        const {type} = highlight.data;
        const position = this.position();
        const {store} = this.context;

        const contents = () => {
            switch (type) {
            case 'ANNOTATION':
                return <AnnotationPopup annotation={highlight} />;
            case 'COMMENT':
                return <CommentPopup comment={highlight} />;
            default:
                console.error('Invalid highlight type in HighlightsPopup.jsx: ', type);
            }
        };

        // We need to create a new provider here because this component gets rendered
        // outside the editor tree and loses context.
        return (
            <Provider store={store}>
                <div className="highlights-popup" style={position}>
                    <Dropdown open={true}>{contents()}</Dropdown>
                </div>
            </Provider>
        );
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
    }

    /**
     * @ngdoc method
     * @name HighlightsPopup#unmountCustom
     * @description Unmounts the popup.
     */
    unmountCustom() {
        unmountComponentAtNode(document.getElementById('react-placeholder'));
        document.addEventListener('click', this.onDocumentClick);
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
        const onPopup = t.hasClass('highlights-popup') || t.closest('.highlights-popup').length;
        const onEditor = t.is(editorNode) || t.closest(editorNode).length;

        if (!onPopup && !onEditor) {
            // if the click occurred outside the editor and the popup we close it
            this.unmountCustom();
        }
    }

    shouldComponentUpdate(nextProps) {
        const nextSelection = nextProps.selection;
        const {selection} = this.props;

        // only update the component if the cursor has moved
        return nextSelection.getAnchorOffset() !== selection.getAnchorOffset() ||
            nextSelection.getAnchorKey() !== selection.getAnchorKey();
    }

    componentDidUpdate() {
        // Waiting one cycle allows the selection to be rendered in the browser
        // so that we can correctly retrieve its position.
        setTimeout(() => this.props.highlight ? this.renderCustom() : this.unmountCustom(), 0);
    }

    render() {
        return null;
    }
}

HighlightsPopup.contextTypes = {
    store: PropTypes.object,
};

HighlightsPopup.propTypes = {
    selection: PropTypes.instanceOf(SelectionState),
    editorNode: PropTypes.object,
    highlight: PropTypes.object
};
