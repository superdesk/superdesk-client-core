import * as React from 'react';
import {IPropsArticleListItemWidget, ISuperdesk} from 'superdesk-api';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';

export function getDisplayMarkedUserComponent(superdesk: ISuperdesk) {
    const {UserAvatar} = superdesk.components;

    return class DisplayMarkedUser extends React.PureComponent<IPropsArticleListItemWidget> {
        render() {
            if (this.props.article.marked_for_user == null) {
                return null;
            } else {
                return (
                    <button onClick={() => manageMarkedUserForSingleArticle(superdesk, this.props.article)}>
                        <UserAvatar userId={this.props.article.marked_for_user} />
                    </button>
                );
            }
        }
    };
}
