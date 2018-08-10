import React from 'react';
import PropTypes from 'prop-types';

export const ListTypeIcon:React.StatelessComponent<any> = ({item}) => {
    const iconClass = item.first_name ? 'icon-user' : 'icon-business';
    const typeTooltip = item.first_name ? gettext('Person Contact') : gettext('Organisation Contact');

    return (
        <div key="type-icon"
            className="list-field type-icon"
            data-sd-tooltip={item.public ? typeTooltip : typeTooltip + ' ' + gettext('(Private)')}
            data-flow="right"
        >
            <i className={iconClass} />
        </div>
    );
};

ListTypeIcon.propTypes = {
    item: PropTypes.object,
};
