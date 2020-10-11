/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IUser} from 'superdesk-api';
import {CC} from 'core/ui/configurable-ui-components';
import {isUserLoggedIn} from '../services/UsersService';
import {gettext} from 'core/utils';
import {AvatarWrapper, AvatarContentText, AvatarContentImage} from 'superdesk-ui-framework/react';
import LazyLoad, {forceVisible} from 'react-lazyload';

export enum AvatarSize {
    small = 24,
    medium = 30,
    large = 48,
}

class DefaultAvatarDisplay extends React.PureComponent<{user: Partial<IUser>}> {
    render() {
        const {user} = this.props;

        if (user == null) {
            return null;
        }

        const tooltipText = user?.display_name ?? null;

        if (user.picture_url == null) {
            const initials = (user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '');

            return (
                <AvatarContentText
                    text={initials.length > 0 ? initials : user.display_name?.[0] ?? ''}
                    tooltipText={tooltipText}
                />
            );
        } else {
            return (
                <AvatarContentImage
                    imageUrl={user.picture_url}
                    tooltipText={tooltipText}
                />
            );
        }
    }
}

interface IProps {
    user: IUser;

    size?: 'small' | 'medium' | 'large'; // defaults to medium

    // indicates whether to show online/offline status
    // should only be used when the user object is up to date
    displayStatus?: boolean;

    displayAdministratorIndicator?: boolean;

    // if it's being rendered inside a container with overflow
    scrollContainer?: string; // css selector string
}

const LazyOrNot = ({children, ...rest}) => {
    let props = rest as IProps;

    if (props.scrollContainer) {
        return (
            <LazyLoad
                once
                overflow
                scrollContainer={props.scrollContainer}
                height={props.size ? AvatarSize[props.size] : AvatarSize.medium}
            >
                {children}
            </LazyLoad>
        );
    }

    return children;
};

export class UserAvatar extends React.PureComponent<IProps> {
    render() {
        const {user, displayStatus, displayAdministratorIndicator} = this.props;

        return (
            <LazyOrNot {...this.props}>
                <AvatarWrapper
                    size={this.props.size}
                    administratorIndicator={
                        displayAdministratorIndicator && user.user_type === 'administrator'
                            ? {enabled: true, tooltipText: gettext('Administrator')}
                            : undefined
                    }
                    statusIndicator={
                        !displayStatus
                            ? undefined
                            : isUserLoggedIn(user)
                                ? {status: 'online', tooltipText: gettext('Online')}
                                : {status: 'offline', tooltipText: gettext('Offline')}
                    }
                    data-test-id="user-avatar"
                >
                    {
                        CC.UserAvatar != null
                            ? <CC.UserAvatar user={user} />
                            : <DefaultAvatarDisplay user={user} />
                    }
                </AvatarWrapper>
            </LazyOrNot>
        );
    }
}
