import React from 'react';
import PropTypes from 'prop-types';

/**
 * Contact header - renders header for contact card used in grid view
 */
export const ContactHeader = ({item}) => {
    const contactIcon = item.first_name ? <i className="icon-user" /> : <i className="icon-business" />;

    return (
        <div className="contact__type-icon" key="contact-header">
            {contactIcon}
        </div>
    );
};

ContactHeader.propTypes = {
    item: PropTypes.object,
};
