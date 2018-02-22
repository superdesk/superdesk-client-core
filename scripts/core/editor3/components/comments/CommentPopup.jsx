import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ng from 'core/services/ng';

import {Comment} from './Comment';
import CommentTextArea from './CommentTextArea';

import {getAuthorInfo} from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentPopupComponent
 * @param {Comment} comment Comment to display.
 * @description CommentPopup renders the popup which displays the content of a comment along
 * with any replies.
 */
export class CommentPopup extends Component {
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

    postReply() {
        const msg = this.state.reply;

        if (msg === '') {
            return; // empty reply message.
        }

        const {highlightsManager, highlightId} = this.props;

        var commentData = highlightsManager.getHighlightData(highlightId);

        if (this.state.index === -1) {
            highlightsManager.updateHighlightData(highlightId, {
                ...commentData,
                data: {
                    ...commentData.data,
                    msg: msg
                }
            });
        } else if (this.state.index !== null) {
            highlightsManager.updateHighlightData(highlightId, {
                ...commentData,
                data: {
                    ...commentData.data,
                    replies: commentData.data.replies.map(
                        (reply, i) => i === this.state.index ? {...reply, msg} : reply
                    )
                }
            });
        } else {
            highlightsManager.updateHighlightData(highlightId, {
                ...commentData,
                data: {
                    ...commentData.data,
                    replies: commentData.data.replies.concat(
                        {
                            msg,
                            ...getAuthorInfo()
                        }
                    )
                }
            });
        }

        this.resetState();
    }

    editReply(data, index) {
        this.setState({reply: data.msg, index: index});
    }

    removeReply(removeAtIndex) {
        const {highlightsManager, highlightId} = this.props;

        var commentData = highlightsManager.getHighlightData(highlightId);

        highlightsManager.updateHighlightData(highlightId, {
            ...commentData,
            data: {
                ...commentData.data,
                replies: commentData.data.replies.filter((reply, i) => i !== removeAtIndex)
            }
        });
    }

    resolveComment() {
        const {highlightsManager, highlightId} = this.props;

        var commentData = highlightsManager.getHighlightData(highlightId);

        highlightsManager.updateHighlightData(highlightId, {
            ...commentData,
            data: {
                ...commentData.data,
                resolved: true
            }
        });
    }

    removeComment() {
        const {highlightsManager, highlightId} = this.props;

        highlightsManager.removeHighlight(highlightId);
    }

    render() {
        const {comment} = this.props;
        const {data} = comment;
        const {replies, resolved} = data;
        const isAuthor = data.email === this.currentUser;

        const onEdit = () => this.editReply(data, -1);

        const onDelete = () => ng.get('modal')
            .confirm(gettext('The comment will be deleted. Are you sure?'))
            .then(() => this.removeComment());

        return (
            <div>
                <Comment data={data} />

                {isAuthor && <a className="btn btn--small btn--hollow" onClick={onEdit}>{gettext('Edit')}</a>}
                {isAuthor && <a className="btn btn--small btn--hollow" onClick={onDelete}>{gettext('Delete')}</a>}
                {!resolved && (
                    <a
                        className="btn btn--small btn--hollow"
                        onClick={() => this.resolveComment()}>
                        {gettext('Resolve')}
                    </a>
                )}

                <div className="comment-replies">
                    {replies.map((data, i) => {
                        const isReplyAuthor = data.email === this.currentUser;
                        const onEdit = isReplyAuthor ? () => this.editReply(data, i) : null;
                        const onRemove = isReplyAuthor ? () => this.removeReply(i) : null;

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
                        <button className="btn btn--small btn--hollow btn-reply" onClick={() => this.postReply()}>
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

CommentPopup.propTypes = {
    comment: PropTypes.object,
    highlightsManager: PropTypes.object.isRequired,
    highlightId: PropTypes.string,
};
