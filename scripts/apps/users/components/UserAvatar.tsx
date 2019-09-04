import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/*
 * @ngdoc React
 * @module superdesk.apps.users
 * @name UserAvatar
 * @param {string} displayName The user's display name.
 * @param {string=} pictureUrl URL of the user's avatar, if provided.
 * @description Displays the user avatar. If `pictureUrl` is provided it shows the picture
 * at that URL, otherwise it shows the initial of `displayName`.
 */
export const UserAvatar: React.StatelessComponent<any> = ({displayName, pictureUrl, title, ...rest}) =>
    <div className="user-avatar" {...rest} title={title || displayName} data-test-id="user-avatar">
        <figure className={classNames(
            'avatar avatar--no-margin',
            {'no-bg': pictureUrl},
            {initials: !pictureUrl},
        )}>
            {pictureUrl && <img src={pictureUrl} />}
            {displayName && <span>{displayName[0].toUpperCase()}</span>}
        </figure>
    </div>;

UserAvatar.propTypes = {
    displayName: PropTypes.string.isRequired,
    title: PropTypes.string,
    pictureUrl: PropTypes.string,
};
