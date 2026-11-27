/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IUser, IEditor3ValueOperational, IGenericSideWidget} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {Button, EmptyState} from 'superdesk-ui-framework/react';
import {getCustomEditor3Data, getCustomMetadataFromContentState} from 'core/editor3/helpers/editor3CustomData';
import {getHighlightsConfig} from 'core/editor3/highlightsConfig';
import {store} from 'core/data';
import {Card} from 'core/ui/components/Card';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {TimeElem} from 'apps/search/components';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';
import {TextWithMentions} from 'apps/users/components';
import {getRangeAndTextForStyleInRawState} from 'core/editor3/helpers/highlights';
import {ContentState, convertToRaw} from 'draft-js';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Inline comments');

type IProps<T> = React.ComponentProps<IGenericSideWidget<T>['component']>;

type IInlineCommentsTab = 'resolved' | 'unresolved';

interface IState {
    selectedTab: IInlineCommentsTab;
}

interface IInlineCommentReply {
    authorId: IUser['_id'];
    msg: string;
    date: string | Date;
}

interface IInlineComment {
    author: string;
    authorId: IUser['_id'];
    msg: string;
    commentedText?: string;
    date: string | Date;
    email: string;
    replies: Array<IInlineCommentReply>;
    resolutionInfo?: {
        resolverUserId: string;
        date: string | Date;
    };
}

const COMMENTS_WIDGET_ID = 'inline-comments-widget-generic';

/**
 * Comments of a field that are not resolved yet. Unlike resolved ones, they do not store
 * the text they were made on, so it is read from the highlighted range.
 */
export function getUnresolvedCommentsFromContentState(contentState: ContentState): Array<IInlineComment> {
    const highlights = getCustomMetadataFromContentState(contentState, getHighlightsConfig().COMMENT.type);

    if (highlights.length < 1) {
        return [];
    }

    const rawContentState = convertToRaw(contentState);

    return highlights.map(({styleName, obj}) => ({
        ...(obj.data as IInlineComment),
        commentedText: getRangeAndTextForStyleInRawState(rawContentState, styleName).highlightedText,
    }));
}

function getUserName(userId: IUser['_id']): string {
    const user: IUser | undefined = store.getState().entities.users[userId];

    return user?.display_name || user?.username || '';
}

function CommentMessage({authorId, msg, date}: {authorId: IUser['_id']; msg: string; date: string | Date}) {
    return (
        <Spacer h gap="8" justifyContent="start" noGrow>
            <UserAvatar user={store.getState().entities.users[authorId]} />

            <div>
                <strong>{getUserName(authorId)}:</strong>
                &nbsp;
                <TextWithMentions message={msg} />

                <div>
                    <TimeElem date={date} />
                </div>
            </div>
        </Spacer>
    );
}

function Comment({comment}: {comment: IInlineComment}) {
    return (
        <Card>
            <div data-test-id="inline-comment">
                <CommentMessage authorId={comment.authorId} msg={comment.msg} date={comment.date} />

                {
                    (comment.replies ?? []).length > 0 && (
                        <Spacer v gap="8" style={{paddingBlockStart: 8, paddingInlineStart: 16}}>
                            {
                                comment.replies.map((reply, i) => (
                                    <div key={i} data-test-id="inline-comment-reply">
                                        <CommentMessage
                                            authorId={reply.authorId}
                                            msg={reply.msg}
                                            date={reply.date}
                                        />
                                    </div>
                                ))
                            }
                        </Spacer>
                    )
                }

                {
                    comment.commentedText != null && (
                        <div
                            className="commented-text"
                            data-test-id="commented-text"
                            style={{
                                paddingBlockStart: 10,
                                marginBottom: 0,
                            }}
                        >
                            <div>
                                {gettext('Selected text:')}
                            </div>

                            <strong
                                title={comment.commentedText}
                            >
                                {comment.commentedText}
                            </strong>
                        </div>
                    )
                }

                {
                    comment.resolutionInfo != null && (
                        <div data-test-id="resolution" style={{paddingBlockStart: 10}}>
                            {`${gettext('Resolved by')} ${getUserName(comment.resolutionInfo.resolverUserId)} `}
                            <TimeElem date={comment.resolutionInfo.date} />
                        </div>
                    )
                }
            </div>
        </Card>
    );
}

export class InlineCommentsWidget<T> extends React.PureComponent<IProps<T>, IState> {
    constructor(props: IProps<T>) {
        super(props);

        this.getEditor3Fields = this.getEditor3Fields.bind(this);
        this.getResolvedComments = this.getResolvedComments.bind(this);
        this.getUnresolvedComments = this.getUnresolvedComments.bind(this);

        this.state = {
            selectedTab: this.getUnresolvedComments().length < 1 ? 'resolved' : 'unresolved',
        };
    }

    getEditor3Fields() {
        const {contentProfile} = this.props;
        const allFields = contentProfile.header.merge(contentProfile.content);

        return allFields.filter((field) => field.fieldType === 'editor3').toArray();
    }

    getResolvedComments() {
        const {fieldsData} = this.props;

        return this.getEditor3Fields().map((field) => {
            const value = fieldsData.get(field.id) as IEditor3ValueOperational;

            return {
                fieldId: field.id,
                comments: (getCustomEditor3Data(
                    value.contentState,
                    'RESOLVED_COMMENTS_HISTORY',
                ) ?? []).map((item) => item.data as IInlineComment),
            };
        }).filter(({comments}) => comments.length > 0);
    }

    getUnresolvedComments() {
        const {fieldsData} = this.props;

        return this.getEditor3Fields().map((field) => {
            const value = fieldsData.get(field.id) as IEditor3ValueOperational;

            return {
                fieldId: field.id,
                comments: getUnresolvedCommentsFromContentState(value.contentState),
            };
        }).filter(({comments}) => comments.length > 0);
    }

    render() {
        const {contentProfile} = this.props;
        const allFields = contentProfile.header.merge(contentProfile.content);
        const unresolvedComments = this.getUnresolvedComments();
        const resolvedComments = this.getResolvedComments();

        const commentsByField = (() => {
            if (this.state.selectedTab === 'unresolved') {
                return unresolvedComments;
            } else if (this.state.selectedTab === 'resolved') {
                return resolvedComments;
            } else {
                assertNever(this.state.selectedTab);
            }
        })();

        const hasComments = resolvedComments.length > 0 || unresolvedComments.length > 0;

        const widgetBody: JSX.Element = hasComments
            ? (
                <div>
                    <Spacer h gap="8" justifyContent="center" noGrow>
                        <Button
                            text={`${gettext('Unresolved')} (${unresolvedComments.length})`}
                            onClick={() => {
                                this.setState({selectedTab: 'unresolved'});
                            }}
                            type={this.state.selectedTab === 'unresolved' ? 'primary' : undefined}
                        />

                        <Button
                            text={`${gettext('Resolved')} (${resolvedComments.length})`}
                            onClick={() => {
                                this.setState({selectedTab: 'resolved'});
                            }}
                            type={this.state.selectedTab === 'resolved' ? 'primary' : undefined}
                        />
                    </Spacer>

                    <SpacerBlock v gap="16" />

                    <Spacer v gap="16">
                        {
                            commentsByField.map(({fieldId, comments}, i) => {
                                return (
                                    <div
                                        key={i}
                                        data-test-id="inline-comments-group"
                                        data-test-value={allFields.get(fieldId).name}
                                    >
                                        <div className="field-label--base">
                                            {allFields.get(fieldId).name}
                                        </div>

                                        <SpacerBlock v gap="8" />

                                        <Spacer v gap="8">
                                            {
                                                comments.map((comment, j) => (
                                                    <Comment
                                                        key={j}
                                                        comment={comment}
                                                    />
                                                ))
                                            }
                                        </Spacer>
                                    </div>
                                );
                            })
                        }
                    </Spacer>
                </div>
            )
            : (
                <EmptyState
                    title={gettext('No comments have been posted')}
                    illustration="3"
                />
            );

        return (
            <AuthoringWidgetLayout
                bodyClassName="authoring-widget__body"
                header={(
                    <AuthoringWidgetHeading
                        widgetId={COMMENTS_WIDGET_ID}
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={widgetBody}
            />
        );
    }
}

export function getInlineCommentsWidgetGeneric<T>() {
    const metadataWidget: IGenericSideWidget<T> = {
        _id: COMMENTS_WIDGET_ID,
        label: getLabel(),
        order: 2,
        icon: 'comments',
        component: InlineCommentsWidget,
        isAllowed: () => true,
    };

    return metadataWidget;
}
