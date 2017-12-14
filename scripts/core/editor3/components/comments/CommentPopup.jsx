import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {replyComment, deleteHighlight} from '../../actions';
import {Comment} from './Comment';
import ng from 'core/services/ng';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentPopupComponent
 * @param {Function} replyComment Action to reply to a comment.
 * @param {Comment} comment Comment to display.
 * @description CommentPopup renders the popup which displays the content of a comment along
 * with any replies.
 */
class CommentPopupComponent extends Component {
    constructor(props) {
        super(props);

        this.input = null;
        this.currentUser = ng.get('session').identity.email;
        this.postReply = this.postReply.bind(this);
    }

    /**
     * @ngdoc method
     * @name CommentPopup#postReply
     * @param {SelectionState} selection Selection that represents the comment that is being
     * replied to.
     * @description Posts a reply to the comment on top of the given selection.
     */
    postReply(selection) {
        const msg = this.input.value;

        if (msg === '') {
            return; // empty reply message.
        }

        this.props.replyComment(selection, {msg});
        this.input.value = '';
        this.forceUpdate();
    }

    componentDidMount() {
        this.focusInput();
    }

    componentDidUpdate() {
        // While this may deem handy, note that removing it will trigger a bug in DraftJS
        // which stops the onChange handler from being called. For some reason, the textarea
        // element in this popup is breaking DraftJS.
        // TODO(x): Maybe this gets fixed in 0.11
        this.focusInput();
    }

    focusInput() {
        this.input.focus();
    }

    render() {
        const {comment} = this.props;
        const {replies} = comment.data;
        const postReply = this.postReply.bind(this, comment.selection);
        const isAuthor = comment.data.email === this.currentUser;
        const modal = ng.get('modal');
        const deleteComment = () => modal
            .confirm(gettext('The comment will be deleted. Are you sure?'))
            .then(() => this.props.deleteHighlight(comment));

        return (
            <div>
                <Comment data={comment.data} />
                {isAuthor && <a className="btn btn--small btn--hollow" onClick={deleteComment}>Delete</a>}

                <div className="comment-replies">
                    {replies.map((data, i) => <Comment key={i} data={data} className="small" />)}
                </div>

                <div className="comment-reply-input">
                    <textarea ref={(el) => {
                        this.input = el;
                    }} />
                    <a className="btn btn--small btn--hollow btn-reply" onClick={postReply}>Reply</a>
                </div>
            </div>
        );
    }
}

CommentPopupComponent.propTypes = {
    comment: PropTypes.object,
    replyComment: PropTypes.func,
};

export const CommentPopup = connect(null, {replyComment, deleteHighlight})(CommentPopupComponent);
