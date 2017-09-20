import React, {Component} from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
import {UserAvatar} from 'apps/users/components';
import moment from 'moment';
import {getVisibleSelectionRect, SelectionState} from 'draft-js';

// topPadding holds the number of pixels between the selection and the top side
// of CommentPopup.
const topPadding = 50;

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentPopup
 * @param {SelectionState} selection The selection on which the comment exists.
 * @param {Node} editor The node of the parent editor (used to calculating positioning).
 * @param {Comment} comment
 * @description CommentPopup displays information about the comment that the cursor
 * is currently on in the editor. CommentPopup renders itself programmatically when
 * this component is updated (inside componentDidUpdate) in order to place itself in
 * Superdesk's common pop-up container, so that it can be displayed on top of the UI.
 */
export class CommentPopup extends Component {
    constructor(props) {
        super(props);

        this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentPopup#position
     * @description position returns the absolute top and left position that the popup
     * needs to be displayed at, with regards to the current selection.
     * @returns {Object} Object containing top and left in pixels.
     */
    position() {
        const {left: editorLeft} = this.props.editor.getBoundingClientRect();
        const rect = getVisibleSelectionRect(window);

        let top = 150;
        let left = editorLeft - 260;

        if (rect) {
            top = rect.top - topPadding;
        }

        return {top, left};
    }

    /**
     * @ngdoc method
     * @name CommentPopup#component
     * @description component returns the popup element to be rendered.
     * @returns {JSX}
     */
    component() {
        const {author, avatar, date, msg} = this.props.comment.data;
        const fromNow = moment(date).calendar();
        const fullDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');
        const position = this.position();

        return (
            <div className="comment-popup" style={position}>
                <Dropdown open={true}>
                    <div className="comment-popup__header">
                        <UserAvatar displayName={author} pictureUrl={avatar} />
                        <div className="user-info">
                            <div className="author-name">{author}</div>
                            <div className="date" title={fullDate}>{fromNow}</div>
                        </div>
                    </div>
                    <div className="comment-popup__body">{msg}</div>
                </Dropdown>
            </div>
        );
    }

    /**
     * @ngdoc method
     * @name CommentPopup#renderCustom
     * @description Renders the comment popup component.
     */
    renderCustom() {
        render(this.component(), document.getElementById('react-placeholder'));
        document.addEventListener('click', this.onDocumentClick);
    }

    /**
     * @ngdoc method
     * @name CommentPopup#unmountCustom
     * @description Unmounts the comment popup component.
     */
    unmountCustom() {
        unmountComponentAtNode(document.getElementById('react-placeholder'));
        document.addEventListener('click', this.onDocumentClick);
    }

    /**
     * @ngdoc method
     * @name CommentPopup#onDocumentClick
     * @param {Event} e
     * @description Triggered when the document is clicked. It checks if the click
     * occurred on the popup or on the editor, and if it didn't, unmounts the
     * component.
     */
    onDocumentClick(e) {
        const t = $(e.target);
        const editorNode = this.props.editor;
        const onPopup = t.hasClass('comment-popup') || t.closest('.comment-popup').length;
        const onEditor = t.is(editorNode) || t.closest(editorNode).length;

        if (!onPopup && !onEditor) {
            // if the click occurred outside the editor and the popup we close it
            this.unmountCustom();
        }
    }

    shouldComponentUpdate(nextProps) {
        const nextSelection = nextProps.selection;
        const {selection} = this.props;

        return nextSelection.getAnchorOffset() !== selection.getAnchorOffset() ||
            nextSelection.getAnchorKey() !== selection.getAnchorKey();
    }

    componentDidUpdate() {
        // Waiting one cycle allows the selection to be rendered in the browser
        // so that we can correctly retrieve its position.
        setTimeout(() => this.props.comment ? this.renderCustom() : this.unmountCustom(), 0);
    }

    render() {
        return null;
    }
}

CommentPopup.propTypes = {
    selection: PropTypes.instanceOf(SelectionState),
    editor: PropTypes.object,
    comment: PropTypes.shape({
        data: PropTypes.shape({
            msg: PropTypes.string,
            author: PropTypes.string,
            avatar: PropTypes.string,
            date: PropTypes.date
        })
    })
};
