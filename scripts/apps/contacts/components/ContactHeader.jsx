import React from 'react';
import PropTypes from 'prop-types';

/**
 * Contact header - renders header for contact card used in grid view
 */
export const ContactHeader = ({item}) => {
    const contactIcon = item.first_name ? <i className="icon-user" /> : <i className="icon-globe" />;

    return (
        <div className="media" key="contact-header">
            <span>{contactIcon}</span>
        </div>
    );
};

ContactHeader.propTypes = {
    item: PropTypes.object
};
