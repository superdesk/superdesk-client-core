import React, {Component} from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import PropTypes from 'prop-types';
import {Dropdown} from 'core/ui/components';
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
        const {author, date, msg} = this.props.comment.data;
        const fromNow = moment(date).fromNow();
        const pretty = moment(date).format('MMMM Do YYYY, h:mm:ss a');
        const position = this.position();

        return (
            <div className="comment-popup" style={position}>
                <Dropdown open={true}>
                    <b>{author}</b> wrote <span title={pretty}>{fromNow}</span>:
                    <div className="comment-popup__body">{msg}</div>
                </Dropdown>
            </div>
        );
    }

    /**
     * @ngdoc method
     * @name CommentPopup#customRender
     * @description customRender mounts the popup component if a comment exists in
     * props, otherwise it unmounts it.
     */
    customRender() {
        const node = document.getElementById('react-placeholder');

        if (this.props.comment) {
            render(this.component(), node);
        } else {
            unmountComponentAtNode(node);
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
        setTimeout(this.customRender.bind(this), 0);
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
            date: PropTypes.date
        })
    })
};
