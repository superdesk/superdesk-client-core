import React from 'react';
import PropTypes from 'prop-types';

export const takekey:React.StatelessComponent<any> = (props) => {
    const {gettextCatalog} = props.svc;

    if (props.item.anpa_take_key) {
        return React.createElement('span', {className: 'takekey', key: 'takekey'},
            gettextCatalog.getString(props.item.anpa_take_key));
    }
}

takekey.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
