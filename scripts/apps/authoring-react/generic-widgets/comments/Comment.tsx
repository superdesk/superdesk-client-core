import React from 'react';
import {
    BoxedListItem,
    BoxedListContentRow,
} from 'superdesk-ui-framework/react';
import {IComment, IUser} from 'superdesk-api';
import {TimeElem} from 'apps/search/components';
import {UserPopup} from 'core/ui/components';
import {UserAvatar} from 'apps/users/components/UserAvatar';

export class Comment extends React.PureComponent<{ comment: IComment, users: { [key: string]: IUser } }> {
    getMessageText = () => {
        const {comment} = this.props;

        let commentText = comment.text;

        if (Object.keys(comment.mentioned_users).length || Object.keys(comment.mentioned_desks).length) {
            const mentions: Array<{ name: string; index: number; id: string; type: string; }> = [];

            // desks
            if (Object.keys(comment.mentioned_desks).length) {
                for (const mention in comment.mentioned_desks) {
                    const mentionText = '#' + mention.replace(/\s/gm, '_');
                    const index = commentText.indexOf(mentionText);

                    mentions.push({
                        name: mention,
                        index: index,
                        id: comment.mentioned_desks[mention],
                        type: 'desk',
                    });
                }
            }

            // users
            if (Object.keys(comment.mentioned_users).length) {
                for (const mention in comment.mentioned_users) {
                    const mentionText = '@' + mention;
                    const index = commentText.indexOf(mentionText);

                    mentions.push({
                        name: mention,
                        index: index,
                        id: comment.mentioned_users[mention],
                        type: 'user',
                    });
                }
            }

            if (mentions.length) {
                const result: Array<JSX.Element> = [];
                let indexFrom: number = 0;

                mentions.sort((a, b) => a.index > b.index ? 1 : -1);

                mentions.forEach((mention) => {
                    let mentionText: string = mention.type === 'user' ? '@' : '#';

                    mentionText += mention.name.replace(/\s/gm, '_');
                    const indexTo: number = commentText.indexOf(mentionText);

                    result.push(<span key={'text' + indexFrom}>{commentText.slice(indexFrom, indexTo)}&nbsp;</span>);

                    if (mention.type === 'user') {
                        result.push(
                            (
                                <UserPopup
                                    key={'mentionUser' + indexFrom}
                                    mentionName={mentionText}
                                    user={this.props.users[mention.id]}
                                />
                            ),
                        );
                    } else {
                        result.push(
                            (
                                <span
                                    style={{color: '#3d8fb1'}}
                                    key={'mentionDesk' + indexFrom}
                                >
                                    {mentionText}
                                </span>
                            ),
                        );
                    }

                    indexFrom = indexTo + mentionText.length;
                });

                result.push(<span key={'endOfMessage'}>&nbsp;{commentText.slice(indexFrom)}</span>);

                return result;
            }
        }

        return commentText;
    }

    render() {
        const {comment} = this.props;

        return (
            <BoxedListItem
                media={comment.user ? (
                    <UserAvatar user={comment.user} />
                ) : null}
            >
                {comment.user?.display_name?.length > 0 && (
                    <BoxedListContentRow>
                        <h4 className="sd-heading sd-text--sans sd-heading--h4">{comment.user.display_name}</h4>
                    </BoxedListContentRow>
                )}

                <BoxedListContentRow>
                    <TimeElem date={comment._updated ? comment._updated : comment._created} />
                </BoxedListContentRow>

                <BoxedListContentRow>
                    <p>{this.getMessageText()}</p>
                </BoxedListContentRow>
            </BoxedListItem>
        );
    }
}
