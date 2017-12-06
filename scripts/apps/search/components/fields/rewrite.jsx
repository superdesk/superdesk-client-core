import React from 'react';
import PropTypes from 'prop-types';

export function rewrite(props) {
    const {gettextCatalog} = props.svc;

    if (props.item.rewrite_of) {
        return <span className="rewrite" key="rewrite">{gettextCatalog.getString('rewrite')}</span>;
    }
    return null;
}

rewrite.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
