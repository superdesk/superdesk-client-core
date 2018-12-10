import React from 'react';
import PropTypes from 'prop-types';

const notEmpty = (str) => typeof str === 'string' && str.length > 0;

export const ContactName: React.StatelessComponent<any> = ({item}) => {
    const displayContact = notEmpty(item.first_name) || notEmpty(item.last_name) ?
        `${notEmpty(item.first_name) ? item.first_name : ''} ${notEmpty(item.last_name) ? item.last_name : ''}`
        : item.organisation;

    return (
        <span key={`contact-name-${item._id}`} className="contact-name">
            {displayContact}
        </span>
    );
};

ContactName.propTypes = {
    item: PropTypes.object,
};
