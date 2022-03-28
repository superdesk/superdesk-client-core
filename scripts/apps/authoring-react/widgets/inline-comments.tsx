/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IAuthoringSideWidget, IExtensionActivationResult, IUser} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {Button, EmptyState} from 'superdesk-ui-framework/react';
import {IEditor3Value} from '../fields/editor3/interfaces';
import {getCustomEditor3Data, getCustomMetadataFromContentState} from 'core/editor3/helpers/editor3CustomData';
import {getHighlightsConfig} from 'core/editor3/highlightsConfig';
import {store} from 'core/data';
import {Card} from 'core/ui/components/Card';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {TimeElem} from 'apps/search/components';
import {assertNever} from 'core/helpers/typescript-helpers';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Inline comments');

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

type IInlineCommentsTab = 'resolved' | 'unresolved';

interface IState {
    selectedTab: IInlineCommentsTab;
}

interface IInlineComment {
    author: string;
    authorId: IUser['_id'];
    msg: string;
    commentedText: string;
    date: string;
    email: string;
    replies: Array<any>;
    resolutionInfo?: {
        resolverUserId: string;
        date: string;
    };
}

class Comment extends React.PureComponent<{comment: IInlineComment}> {
    render() {
        const {comment} = this.props;
        const user =
            store.getState().users.entities[comment.authorId];

        return (
            <Card>
                <Spacer h gap="8" justifyContent="start" noGrow>
                    <UserAvatar user={user} />

                    <div>
                        <strong>{user.display_name}</strong>:
                        &nbsp;
                        {comment.msg}

                        <div>
                            <TimeElem date={comment.date} />
                        </div>
                    </div>
                </Spacer>

                {
                    comment.commentedText != null && (
                        <div
                            className="commented-text"
                            style={{
                                paddingTop: 10,
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
            </Card>
        );
    }
}

class InlineCommentsWidget extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
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
            const value = fieldsData.get(field.id) as IEditor3Value;

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
            const value = fieldsData.get(field.id) as IEditor3Value;

            return {
                fieldId: field.id,
                comments: getCustomMetadataFromContentState(
                    value.contentState,
                    getHighlightsConfig().COMMENT.type,
                ).map((item) => item.obj.data as IInlineComment),
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
                                    <div key={i}>
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
                header={(
                    <AuthoringWidgetHeading
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={widgetBody}
                background="grey"
            />
        );
    }
}

export function getInlineCommentsWidget() {
    const metadataWidget: IAuthoringSideWidget = {
        _id: 'inline-comments-widget',
        label: getLabel(),
        order: 2,
        icon: 'comments',
        component: InlineCommentsWidget,
        isAllowed: (item) => item._type !== 'legal_archive',
    };

    return metadataWidget;
}
