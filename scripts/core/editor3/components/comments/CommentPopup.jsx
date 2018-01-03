import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    replyComment,
    deleteHighlight,
    resolveComment,
    showPopup,
    PopupTypes
} from '../../actions';
import {Comment} from './Comment';
import CommentTextArea from './CommentTextArea';
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

        this.currentUser = ng.get('session').identity.email;
        this.postReply = this.postReply.bind(this);
        this.state = {reply: ''};
    }

    /**
     * @ngdoc method
     * @name CommentPopup#postReply
     * @param {SelectionState} selection Selection that represents the comment that is being
     * replied to.
     * @description Posts a reply to the comment on top of the given selection.
     */
    postReply(selection) {
        const msg = this.state.reply;

        if (msg === '') {
            return; // empty reply message.
        }

        this.props.replyComment(selection, {msg});
        this.setState({reply: ''});
    }

    render() {
        const {comment} = this.props;
        const {data, selection} = comment;
        const {replies, resolved, msg} = data;
        const isAuthor = data.email === this.currentUser;

        const onEdit = () => this.props.showPopup(PopupTypes.Comment, {msg, selection});
        const onReply = this.postReply.bind(this, selection);
        const onResolve = this.props.resolveComment.bind(this, comment);
        const onDelete = () => ng.get('modal')
            .confirm(gettext('The comment will be deleted. Are you sure?'))
            .then(() => this.props.deleteHighlight(comment));

        return (
            <div>
                <Comment data={data} />

                {isAuthor && <a className="btn btn--small btn--hollow" onClick={onEdit}>{gettext('Edit')}</a>}
                {isAuthor && <a className="btn btn--small btn--hollow" onClick={onDelete}>{gettext('Delete')}</a>}
                {!resolved && <a className="btn btn--small btn--hollow" onClick={onResolve}>{gettext('Resolve')}</a>}

                <div className="comment-replies">
                    {replies.map((data, i) => <Comment key={i} data={data} className="small" />)}
                </div>

                <div className="comment-reply-input">
                    <CommentTextArea
                        value={this.state.reply}
                        onChange={(event, value) => this.setState({reply: value})}
                    />

                    <div className="comment-reply-buttons">
                        <a className="btn btn--small btn--hollow btn-reply" onClick={onReply}>{gettext('Reply')}</a>
                    </div>
                </div>
            </div>
        );
    }
}

CommentPopupComponent.propTypes = {
    comment: PropTypes.object,
    replyComment: PropTypes.func,
    resolveComment: PropTypes.func,
    deleteHighlight: PropTypes.func,
    showPopup: PropTypes.func
};

export const CommentPopup = connect(null, {
    replyComment,
    deleteHighlight,
    resolveComment,
    showPopup
})(CommentPopupComponent);
