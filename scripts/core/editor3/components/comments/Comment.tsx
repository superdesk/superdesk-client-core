import React from 'react';
import moment from 'moment';
import {TextWithMentions} from 'apps/users/components';
import CommentTextArea from './CommentTextArea';
import PropTypes from 'prop-types';
import {UserAvatarFromUserId} from 'apps/users/components/UserAvatarFromUserId';
import {EditorHighlightsHeader} from 'core/editor3/editorPopup/EditorHighlightsHeader';
import {FluidRows} from '../../fluid-flex-rows/fluid-rows';
import {FluidRow} from '../../fluid-flex-rows/fluid-row';
import {gettext} from 'core/utils';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Comment
 * @description Comment is a component that displays the author information along with the timestamp
 * and the body of that comment. It is also used for displaying replies and can take an
 * additional class.
 */

export class Comment extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {
            actionsDropdownOpen: false,
            editMode: false,
            editModeValue: this.props.data.msg,
        };
    }
    cancelEditing(event?) {
        this.setState({
            editMode: false,
            editModeValue: this.props.data.msg,
        });
    }
    toggleActionsDropdown() {
        this.setState({
            actionsDropdownOpen: !this.state.actionsDropdownOpen,
        });
    }
    render() {
        const {onRemove, isAuthor, isReply} = this.props;

        const {author, authorId, date} = this.props.data;

        const absoluteDateString = moment(date).format('MMMM Do YYYY, h:mm:ss a');
        const relativeDateString = moment(date).calendar();

        const isRoot = this.props.isReply === false;

        const availableActions = isAuthor !== true ? [] : [
            {
                text: gettext('Edit'),
                icon: 'icon-pencil',
                onClick: () => this.setState({editMode: true}),
            },
            {
                text: gettext('Delete'),
                icon: 'icon-trash',
                onClick: onRemove,
            },
        ];

        return (
            <FluidRows onClick={this.props.onClick} className={isReply ? 'comment-box__reply-item' : null}>
                <FluidRow scrollable={false}>
                    <EditorHighlightsHeader availableActions={availableActions}>
                        <div className="flex-row sibling-spacer-10">
                            <UserAvatarFromUserId userId={authorId} />
                            <div>
                                <p className="editor-popup__author-name">{author}</p>
                                <time
                                    className="editor-popup__time"
                                    title={relativeDateString}
                                    style={{display: 'block'}}
                                >
                                    {absoluteDateString}
                                </time>
                            </div>
                        </div>
                    </EditorHighlightsHeader>

                    {
                        isReply !== false ? null : (
                            <div className="editor-popup__content-block" style={{paddingBottom: 0}}>
                                <div className="space-between editor-popup__info-bar">
                                    <span className="label">{gettext('Comment')}</span>
                                    {this.props.inlineActions || null}
                                </div>
                            </div>
                        )
                    }
                </FluidRow>

                <FluidRow className="editor-popup__content-block" scrollable={!this.state.editMode}>
                    {
                        this.state.editMode === true ?
                            (
                                <div>
                                    <CommentTextArea
                                        className="comment-box__input"
                                        value={this.state.editModeValue}
                                        onChange={(event, value) => this.setState({editModeValue: value})}
                                        singleLine={false}
                                        maxHeight={isRoot === true ? 300 : undefined}
                                    />

                                    <div
                                        className={
                                            'comment-box__button-toolbar'
                                            + ' comment-box__button-toolbar--right'
                                            + ' comment-box__button-toolbar--small'
                                        }
                                    >
                                        <button
                                            onClick={(event) => {
                                                this.cancelEditing(event);
                                            }}
                                            className="btn btn--icon-only btn--hollow"
                                        >
                                            <i className="icon-close-small" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                this.props.updateComment(this.state.editModeValue);
                                                this.cancelEditing();
                                            }}
                                            className="btn btn--primary btn--icon-only"
                                        >
                                            <i className="icon-ok" />
                                        </button>
                                    </div>
                                </div>
                            )
                            : (
                                <TextWithMentions>
                                    {this.props.data.msg}
                                </TextWithMentions>
                            )
                    }
                </FluidRow>

                {
                    this.props.scrollableContent == null ? null : (
                        <FluidRow className="editor-popup__secondary-content" scrollable={true}>
                            {this.props.scrollableContent}
                        </FluidRow>
                    )
                }

                {
                    this.props.stickyFooter == null ? null : (
                        <FluidRow scrollable={false}>
                            <div className="editor-popup__secondary-content">
                                <div className="editor-popup__content-block">
                                    {this.props.stickyFooter}
                                </div>
                            </div>
                        </FluidRow>
                    )
                }
            </FluidRows>
        );
    }
}

Comment.propTypes = {
    data: PropTypes.shape({
        author: PropTypes.string,
        date: PropTypes.any,
        avatar: PropTypes.string,
        msg: PropTypes.string,
    }),
    onClick: PropTypes.func,
    inlineActions: PropTypes.object,
    replies: PropTypes.object,
    className: PropTypes.string,
    updateComment: PropTypes.func.isRequired,
    onRemove: PropTypes.func,
    isAuthor: PropTypes.bool.isRequired,
    isReply: PropTypes.bool.isRequired,
    position: PropTypes.func,
    editorNode: PropTypes.object,
    scrollableContent: PropTypes.object,
    stickyFooter: PropTypes.object,
};
