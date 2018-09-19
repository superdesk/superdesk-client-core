import React from 'react';
import PropTypes from 'prop-types';

/**
 * Contact header - renders header for contact card used in grid view
 */
export const ContactHeader: React.StatelessComponent<any> = ({item}) => {
    const typeTooltip = item.first_name ? gettext('Person Contact') : gettext('Organisation Contact');

    const contactIcon = item.first_name ?
        <i className="icon-user" /> : <i className="icon-business" />;

    return (
        <div
            className="contact__type-icon"
            key="contact-header"
            data-sd-tooltip={item.public ? typeTooltip : typeTooltip + ' ' + gettext('(Private)')}
            data-flow="right"
        >
            {contactIcon}
        </div>
    );
};

ContactHeader.propTypes = {
    item: PropTypes.object,
};
