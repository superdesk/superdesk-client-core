import React from 'react';
import PropTypes from 'prop-types';

/**
 * Usage Terms field
 * @param {Object} props
 */
export const usageterms: React.StatelessComponent<any> = ({item}) => {
    if (item.usageterms) {
        return (
            <small key="usageterms"
                className="usageterms container"
            >{item.usageterms}</small>
        );
    }

    return null;
};

usageterms.propTypes = {
    item: PropTypes.object.isRequired,
};
