import * as React from 'react';
import {manageMarkedUserForSingleArticle} from './managed-marked-user';
import {ISuperdesk, IArticle} from 'superdesk-api';

export function getDisplayMarkedUserComponent(superdesk: ISuperdesk) {
    const {UserAvatar} = superdesk.components;
    const {hasPrivilege} = superdesk.privileges;

    return class DisplayMarkedUser extends React.PureComponent<{entity: IArticle}> {
        render() {
            if (this.props.entity.marked_for_user == null) {
                return null;
            } else {
                return (
                    <button
                        onClick={() => manageMarkedUserForSingleArticle(superdesk, this.props.entity)}
                        style={{padding: 0}}
                        disabled={!hasPrivilege('mark_for_user')}
                        data-test-id="marked-for-user"
                    >
                        <UserAvatar userId={this.props.entity.marked_for_user} />
                    </button>
                );
            }
        }
    };
}
