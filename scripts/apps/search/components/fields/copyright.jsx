import React from 'react';
import PropTypes from 'prop-types';

/**
 * Copyright info field
 * @param {Object} props
 */
export function copyright({item}) {
    if (item.copyrightholder) {
        const title = item.usageterms || item.copyrightnotice || '';

        return (
            <small key="copyright"
                className="copyright container"
                title={title}
            >&copy; {item.copyrightholder}</small>
        );
    }

    return null;
}

copyright.propTypes = {
    item: PropTypes.object.isRequired,
};
