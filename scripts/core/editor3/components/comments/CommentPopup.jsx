import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import ng from 'core/services/ng';

import {Comment} from './Comment';
import CommentTextArea from './CommentTextArea';

import {
    replyComment,
    deleteHighlight,
    resolveComment,
    removeReply,
    updateReply,
} from '../../actions/highlights';

import {
    showPopup,
    PopupTypes
} from '../../actions/popups';

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
        this.state = {reply: '', index: null};
        this.resetState = this.resetState.bind(this);
    }

    resetState(event) {
        ng.get('$timeout')( // must run after the click handler finishes
            () => this.setState({reply: '', index: null}),
            10,
            false
        );
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

        if (this.state.index !== null) {
            this.props.updateReply(selection, this.state.index, msg);
        } else {
            this.props.replyComment(selection, {msg});
        }

        this.resetState();
    }

    editReply(data, index) {
        this.setState({reply: data.msg, index: index});
    }

    removeReply(data, index) {
        const {selection} = this.props.comment;

        this.props.removeReply(selection, index);
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
                    {replies.map((data, i) => {
                        const isReplyAuthor = data.email === this.currentUser;
                        const onEdit = isReplyAuthor ? () => this.editReply(data, i) : null;
                        const onRemove = isReplyAuthor ? () => this.removeReply(data, i) : null;

                        return (
                            <Comment key={i}
                                data={data}
                                onEdit={onEdit}
                                onRemove={onRemove}
                                className="small" />
                        );
                    })}
                </div>

                <div className="comment-reply-input">
                    <CommentTextArea
                        value={this.state.reply}
                        onChange={(event, value) => this.setState({reply: value})}
                    />

                    <div className="comment-reply-buttons">
                        <button className="btn btn--small btn--hollow btn-reply" onClick={onReply}>
                            {this.state.index !== null ? gettext('Save') : gettext('Reply')}
                        </button>

                        {this.state.index !== null && (
                            <button className="btn btn--small btn--hollow" onClick={this.resetState}>
                                {gettext('Cancel')}
                            </button>
                        )}
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
    showPopup: PropTypes.func,
    removeReply: PropTypes.func,
    updateReply: PropTypes.func,
};

export const CommentPopup = connect(null, {
    replyComment,
    deleteHighlight,
    resolveComment,
    showPopup,
    removeReply,
    updateReply,
})(CommentPopupComponent);
