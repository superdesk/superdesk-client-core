import React from 'react';
import PropTypes from 'prop-types';

export function duplicated(props) {
    const {gettextCatalog} = props.svc;

    if (props.item.operation == 'duplicate') {
        return <span className="duplicated" key="duplicated">{gettextCatalog.getString('duplicated')}</span>;
    }
    return null;
}

duplicated.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
