import React from 'react';
import {showPopup} from 'core/ui/components/popupNew';
import {IUser} from 'superdesk-api';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {gettext} from 'core/utils';

interface IProps {
    user: IUser;
    mentionName: string;
}

const UserPopup = ({mentionName, user}: IProps) => {
    const renderPopup = (referenceElement: HTMLElement) => {
        showPopup(
            referenceElement,
            'left-end',
            ({closePopup}) => (
                <div
                    className="user-popup"
                    style={{display: 'block'}}
                >
                    <div style={{paddingBlockEnd: '20px', display: 'flex', justifyContent: 'center'}}>
                        <UserAvatar user={user} size="large" />
                    </div>
                    <div className="title">{user.display_name}</div>
                    <div className="actions">
                        <a href={'#/users/' + user._id}>{gettext('go to profile')}</a>
                    </div>
                </div>
            ),
            100,
            true,
        );
    };

    return (
        <span
            style={{color: '#3d8fb1'}}
            onMouseEnter={(event) => {
                renderPopup(event.target as HTMLElement);
            }}
        >
            {mentionName}
        </span>
    );
};

export default UserPopup;
