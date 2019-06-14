import * as React from 'react';
import {IPropsArticleListItemWidget, ISuperdesk} from 'superdesk-api';

export function getDisplayMarkedUserComponent(superdesk: ISuperdesk) {
    const {UserAvatar} = superdesk.components;

    return class DisplayMarkedUser extends React.PureComponent<IPropsArticleListItemWidget> {
        render() {
            if (this.props.article.marked_for_user == null) {
                return null;
            } else {
                return (
                    <button onClick={() => {
                        console.log('test');
                    }}>
                        <UserAvatar userId={this.props.article.marked_for_user} />
                    </button>
                );
            }
        }
    };
}
