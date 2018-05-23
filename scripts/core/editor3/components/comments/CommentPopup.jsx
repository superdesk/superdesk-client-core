import React, {Component} from 'react';
import {EditorState} from 'draft-js';
import PropTypes from 'prop-types';

import ng from 'core/services/ng';
import {Comment} from './Comment';
import CommentTextArea from './CommentTextArea';
import {getAuthorInfo} from '../../actions';
import {editor3DataKeys, getCustomDataFromEditor, setCustomDataForEditor} from '../../helpers/editor3CustomData';
import * as Highlights from '../../helpers/highlights';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name CommentPopupComponent
 * @param {Comment} comment Comment to display.
 * @description CommentPopup renders the popup which displays the content of a comment along
 * with any replies.
 */

const initialCommentsState = {reply: '', index: null, replyFieldFocused: false};

export class CommentPopup extends Component {
    constructor(props) {
        super(props);

        this.currentUser = ng.get('session').identity.email;
        this.state = initialCommentsState;
    }

    resetReply() {
        this.setState(initialCommentsState);
    }

    postReply(commentData, msg) {
        this.props.highlightsManager.updateHighlightData(this.props.highlightId, {
            ...commentData,
            data: {
                ...commentData.data,
                replies: commentData.data.replies.concat(
                    {
                        msg,
                        ...getAuthorInfo(),
                    }
                ),
            },
        });

        this.resetReply();
    }

    editComment(commentData, msg) {
        this.props.highlightsManager.updateHighlightData(this.props.highlightId, {
            ...commentData,
            data: {
                ...commentData.data,
                msg: msg,
            },
        });
    }

    editReply(commentData, index, msg) {
        this.props.highlightsManager.updateHighlightData(this.props.highlightId, {
            ...commentData,
            data: {
                ...commentData.data,
                replies: commentData.data.replies.map(
                    (reply, i) => i === index ? {...reply, msg} : reply
                ),
            },
        });
    }

    removeReply(removeAtIndex) {
        const {highlightsManager, highlightId} = this.props;

        var commentData = highlightsManager.getHighlightData(highlightId);

        highlightsManager.updateHighlightData(highlightId, {
            ...commentData,
            data: {
                ...commentData.data,
                replies: commentData.data.replies.filter((reply, i) => i !== removeAtIndex),
            },
        });
    }

    resolveComment() {
        const {highlightsManager, highlightId, editorState} = this.props;

        const commentData = highlightsManager.getHighlightData(highlightId);
        const {highlightedText} = Highlights.getRangeAndTextForStyle(editorState, highlightId);

        const editorStateWithCommentRemoved = Highlights.removeHighlight(editorState, highlightId);

        const resolvedCommentData = {
            data: {
                ...commentData.data,
                commentedText: highlightedText,
                resolutionInfo: {
                    resolverUserId: ng.get('session').identity._id,
                    date: new Date(),
                },
            },
        };

        const allResolvedComments = getCustomDataFromEditor(
            editorState,
            editor3DataKeys.RESOLVED_COMMENTS_HISTORY
        );

        const editorStateWithResolvedCommentAdded = setCustomDataForEditor(
            editorStateWithCommentRemoved,
            editor3DataKeys.RESOLVED_COMMENTS_HISTORY,
            (allResolvedComments || []).concat(resolvedCommentData)
        );

        this.props.onChange(editorStateWithResolvedCommentAdded);
    }

    removeComment() {
        const {highlightsManager, highlightId} = this.props;

        highlightsManager.removeHighlight(highlightId);
    }
    manageFocusForReplyInput(event) {
        // using onblur handler doesn't work since the focus is lost when clicking a autocomplete option
        if (this.addReplyEl != null && this.addReplyEl.contains(event.target) === false) {
            this.setState({replyFieldFocused: false});
        }
    }
    render() {
        const {comment} = this.props;
        const {data} = comment;
        const {replies, resolutionInfo} = data;
        const isAuthor = data.email === this.currentUser;

        const removeCommentPromise = () => ng.get('modal')
            .confirm(gettext('The comment will be deleted. Are you sure?'))
            .then(() => this.removeComment());

        const removeReplyPromise = (index) => ng.get('modal')
            .confirm(gettext('The reply will be deleted. Are you sure?'))
            .then(() => this.removeReply(index));

        return (
            <div onClick={(e) => this.manageFocusForReplyInput(e)}>
                <Comment
                    data={data}
                    updateComment={(msg) => this.editComment(comment, msg)}
                    onRemove={removeCommentPromise}
                    isAuthor={isAuthor}
                    isReply={false}
                    editorNode={this.props.editorNode}
                    inlineActions={(
                        <div className="comment-box__button-toolbar comment-box__button-toolbar--right">
                            {resolutionInfo === null && (
                                <button
                                    className="btn btn--hollow btn--small"
                                    onClick={() => this.resolveComment()}>
                                    {gettext('Resolve')}
                                </button>
                            )}
                        </div>
                    )}
                    scrollableContent={(
                        <div>
                            {replies.map((reply, i) => (
                                <Comment
                                    key={i}
                                    data={reply}
                                    updateComment={(msg) => this.editReply(comment, i, msg)}
                                    onRemove={() => removeReplyPromise(i)}
                                    isAuthor={isAuthor}
                                    isReply={true}
                                />
                            ))}
                        </div>
                    )}
                    stickyFooter={(
                        <div ref={(el) => {
                            this.addReplyEl = el;
                        }}>
                            <CommentTextArea
                                className="comment-box__input"
                                value={this.state.reply}
                                onChange={(event, value) => this.setState({reply: value})}
                                onFocus={() => {
                                    this.setState({replyFieldFocused: true});
                                }}
                                singleLine={false}
                                placeholder={'Reply'}
                            />
                            {
                                this.state.replyFieldFocused !== true ? null : (
                                    <div
                                        className="comment-box__reply-toolbar comment-box__reply-toolbar--active"
                                    >
                                        <button onClick={() => {
                                            this.postReply(comment, this.state.reply);
                                        }} className="btn btn--primary">
                                            {gettext('Reply')}
                                        </button>
                                        <button onClick={() => this.resetReply()} className="btn">
                                            {gettext('Cancel')}
                                        </button>
                                    </div>
                                )
                            }
                        </div>
                    )}
                />
            </div>
        );
    }
}

CommentPopup.propTypes = {
    comment: PropTypes.object,
    highlightsManager: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    editorState: PropTypes.instanceOf(EditorState),
    highlightId: PropTypes.string,
    editorNode: PropTypes.object,
};
