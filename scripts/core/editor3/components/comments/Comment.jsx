import React from 'react';
import moment from 'moment';
import {UserAvatar, TextWithMentions} from 'apps/users/components';
import PropTypes from 'prop-types';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Comment
 * @param {Object} data Comment data.
 * @param {String} className Optional class.
 * @description Comment is a component that displays the author information along with the timestamp
 * and the body of that comment. It is also used for displaying replies and can take an
 * additional class.
 */
export const Comment = ({data, className, onEdit, onRemove}) => {
    const {author, date, avatar, msg} = data;
    const fromNow = moment(date).calendar();
    const fullDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');

    return (
        <div className={className}>
            <div className="highlights-popup__header">
                <UserAvatar displayName={author} pictureUrl={avatar} />
                <div className="user-info">
                    <div className="author-name">{author}</div>
                    <div className="date" title={fullDate}>{fromNow}</div>
                </div>
                {onEdit && onRemove && (
                    <div className="highlights-popup__header__actions">
                        <button onClick={onEdit} title={gettext('Edit')}><i className="icon-pencil" /></button>
                        <button onClick={onRemove} title={gettext('Remove')}><i className="icon-close-small" /></button>
                    </div>
                )}
            </div>
            <TextWithMentions className="highlights-popup__body">{msg}</TextWithMentions>
        </div>
    );
};

Comment.propTypes = {
    data: PropTypes.shape({
        author: PropTypes.string,
        date: PropTypes.date,
        avatar: PropTypes.string,
        msg: PropTypes.string
    }),
    className: PropTypes.string,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
};
