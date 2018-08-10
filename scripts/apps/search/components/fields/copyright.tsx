import React from 'react';
import PropTypes from 'prop-types';

export const copyright:React.StatelessComponent<any> = ({item}) => {
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
