/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IUser, IDesk, IRestApiResponse, IGenericSidebarComponentProps, IComment} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {
    Button,
    EmptyState,
    Checkbox,
    BoxedList,
} from 'superdesk-ui-framework/react';
import {store} from 'core/data';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {Spacer} from 'core/ui/components/Spacer';
import {MentionsInput, Mention} from 'react-mentions';
import mentionsStyle from './mention.style';
import {Comment} from './Comment';
import {IDeskSuggestion, IUserSuggestion, IUserSuggestionData} from './interfaces';
import {COMMENT_WIDGET_ID} from '.';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Comments');

interface IProps<T> extends IGenericSidebarComponentProps<T> {
    getComments: () => Promise<Array<IComment>>;
    addComment(comment: string): Promise<void>;
}

interface IState {
    comments: Array<IComment> | null;
    newCommentMessage: string;
    saveOnEnter: boolean;
    users: { [key: string]: IUser };
    mentionInputDataUsers: Array<{ id: string, display: string }>;
    mentionInputDataDesks: Array<{ id: string, display: string }>;
}

function renderSuggestion(item: IDeskSuggestion | IUserSuggestion, search, highlightedDisplay) {
    return (
        <React.Fragment>
            {item.type === 'desk'
                ? <i className="icon-tasks" />
                : <UserAvatar user={item.user} size="small" />
            }
            <span style={{marginLeft: '1em'}}>{highlightedDisplay}</span>
        </React.Fragment>
    );
}

class CommentsWidget<T> extends React.PureComponent<IProps<T>, IState> {
    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            comments: null,
            newCommentMessage: '',
            saveOnEnter: false,
            users: {},
            mentionInputDataUsers: [],
            mentionInputDataDesks: [],
        };
    }

    componentDidMount() {
        Promise.all([
            this.loadDeskSuggestions(),
            this.loadUsers(),
            this.loadComments(),
        ])
            .then(([deskSuggestions, userSuggestionsData, comments]) => {
                this.setState({
                    mentionInputDataDesks: deskSuggestions,
                    users: userSuggestionsData.users,
                    mentionInputDataUsers: userSuggestionsData.mentionInputDataUsers,
                    comments: comments,
                });
            });
    }

    loadDeskSuggestions = (): Promise<Array<IDeskSuggestion>> => {
        return new Promise((resolve) => {
            httpRequestJsonLocal<IRestApiResponse<IDesk>>({
                method: 'GET',
                path: '/desks',
            }).then((response) => {
                const deskSuggestions: Array<IDeskSuggestion> = response._items.map(
                    (desk) => {
                        return {id: desk.name.replace(/\s/gm, '_'), display: desk.name, type: 'desk'};
                    },
                );

                resolve(deskSuggestions);
            });
        });
    }

    loadUsers = (): Promise<IUserSuggestionData> => {
        return new Promise((resolve) => {
            const users = store.getState().entities.users;
            const mentionInputDataUsers: Array<IUserSuggestion> = [];

            for (const key in users) {
                mentionInputDataUsers.push(
                    {id: users[key].username, display: users[key].display_name, type: 'user', user: users[key]},
                );
            }

            resolve({users: users, mentionInputDataUsers: mentionInputDataUsers});
        });
    }

    loadComments = (): Promise<Array<IComment>> => {
        return this.props.getComments();
    }

    reload = (): void => {
        this.loadComments()
            .then((comments) => {
                this.setState({comments});
            });
    }

    save = (): void => {
        if (!this.state.newCommentMessage.length) {
            return;
        }

        const userRegex = /'@\[[^\]\[]*\]\(user\:([^\)\(]*)\)\'/gm;
        const deskRegex = /'@\[[^\]\[]*\]\(desk\:([^\)\(]*)\)\'/gm;
        let newCommentMessage = this.state.newCommentMessage;

        newCommentMessage = newCommentMessage.replace(userRegex, '@$1');
        newCommentMessage = newCommentMessage.replace(deskRegex, '#$1');

        this.props.addComment(newCommentMessage).then(() => {
            this.setState({newCommentMessage: ''});
            this.reload();
        });
    }

    handleCommentInputKeyDown = (event): void => {
        if (!this.state.saveOnEnter || event.key !== 'Enter' || event.shiftKey) {
            return;
        }
        this.save();
    }

    render() {
        const hasComments = this.state.comments?.length > 0;

        const widgetBody: JSX.Element = hasComments
            ? (
                <BoxedList>
                    {
                        this.state.comments.map((comment, i) =>
                            (<Comment key={i} comment={comment} users={this.state.users} />),
                        )
                    }
                </BoxedList>
            )
            : (
                <EmptyState
                    title={gettext('No comments have been posted')}
                    illustration="3"
                />
            );

        const widgetFooter: JSX.Element = (
            <Spacer v gap="8" >
                <MentionsInput
                    value={this.state.newCommentMessage}
                    onChange={(ev, newValue) => {
                        this.setState({newCommentMessage: newValue});
                    }}
                    style={mentionsStyle.input}
                    markup="'@[__display__](__type__:__id__)'"
                    placeholder={gettext('Type your comment...')}
                    onKeyDown={this.handleCommentInputKeyDown}
                >
                    <Mention
                        data={this.state.mentionInputDataUsers}
                        trigger="@"
                        type="user"
                        style={mentionsStyle.mention}
                        appendSpaceOnAdd
                        renderSuggestion={renderSuggestion}
                    />

                    <Mention
                        data={this.state.mentionInputDataDesks}
                        trigger="#"
                        type="desk"
                        style={mentionsStyle.mention}
                        appendSpaceOnAdd
                        renderSuggestion={renderSuggestion}
                    />
                </MentionsInput>

                <Spacer h gap="4" justifyContent="space-between" noGrow>
                    <Checkbox
                        checked={this.state.saveOnEnter}
                        label={{text: 'post on "Enter"'}}
                        onChange={(value) => {
                            this.setState({saveOnEnter: value});
                        }}
                    />

                    <Button
                        text="post"
                        type="primary"
                        onClick={this.save}
                        disabled={this.state.newCommentMessage.length < 1}
                    />
                </Spacer>
            </Spacer>
        );

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={COMMENT_WIDGET_ID}
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={widgetBody}
                background="grey"
                footer={widgetFooter}
            />
        );
    }
}

export default CommentsWidget;
