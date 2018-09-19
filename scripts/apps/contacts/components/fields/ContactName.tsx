import React from 'react';
import PropTypes from 'prop-types';

export const ContactName: React.StatelessComponent<any> = ({item}) => {
    const displayContact = item.first_name ? `${item.first_name} ${item.last_name}` : item.organisation;

    return (
        <span key={`contact-name-${item._id}`} className="contact-name">
            {displayContact}
        </span>
    );
};

ContactName.propTypes = {
    item: PropTypes.object,
};
