import React from 'react';
import PropTypes from 'prop-types';

export const ListTypeIcon = ({item}) => {
    let iconClass = item.first_name ? 'icon-user' : 'icon-globe';

    return (
        <div key="type-icon" className="list-field type-icon">
            <i className={iconClass} />
        </div>
    );
};

ListTypeIcon.propTypes = {
    item: PropTypes.object,
};
