import React from 'react';
import PropTypes from 'prop-types';

/**
 * Org Name - to display organisation name of user contact
 */
export const OrgName = ({item}) => (
    <div key="org-name" className="container">
        {item.first_name && item.organisation && <i className="icon-globe" />}
        {
            item.first_name && item.organisation &&
                <span>{item.organisation}</span>
        }
    </div>
);

OrgName.propTypes = {
    item: PropTypes.object
};
