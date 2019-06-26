import * as React from 'react';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';
import {ISuperdesk, IArticle} from 'superdesk-api';

export function getDisplayMarkedUserComponent(superdesk: ISuperdesk) {
    const {UserAvatar} = superdesk.components;

    return class DisplayMarkedUser extends React.PureComponent<{article: IArticle}> {
        render() {
            if (this.props.article.marked_for_user == null) {
                return null;
            } else {
                return (
                    <button
                        onClick={() => manageMarkedUserForSingleArticle(superdesk, this.props.article)}
                        style={{padding: 0}}
                    >
                        <UserAvatar userId={this.props.article.marked_for_user} />
                    </button>
                );
            }
        }
    };
}
