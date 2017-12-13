import React from 'react';
import PropTypes from 'prop-types';
import {JobTitle} from 'apps/contacts/components/fields';

/**
 * Contact header - renders header for contact card used in grid view
 */
export const ContactHeader = ({item}) => {
    const contactIcon = item.first_name ? <i className="icon-user" /> : <i className="icon-globe" />;
    const contactJobTitle = item.job_title ? <span className="item-info"><JobTitle item={item} /></span> : null;
    const contactOrg = item.first_name && item.organisation ?
        <span className="org-label">{item.organisation}</span> : null;

    return (
        <div className="media" key="contact-header">
            <span>{contactIcon}{contactJobTitle}{contactOrg}</span>
        </div>
    );
};

ContactHeader.propTypes = {
    item: PropTypes.object
};
