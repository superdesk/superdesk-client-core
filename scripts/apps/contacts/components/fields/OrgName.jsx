import React from 'react';
import PropTypes from 'prop-types';

/**
 * Org Name - to display organisation name of user contact in grid view
 */
export const OrgName = ({item}) => {
    let cssClass = item.first_name && item.organisation ? 'org-label' : null;

    return (
        <div key="org-name" className={cssClass}>
            {
                item.first_name && item.organisation &&
                <span>{item.organisation}</span>
            }
        </div>
    );
};

OrgName.propTypes = {
    item: PropTypes.object
};
