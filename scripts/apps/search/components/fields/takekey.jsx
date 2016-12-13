import React from 'react';

export function takekey(props) {
    const {gettextCatalog} = props.svc;

    if (props.item.anpa_take_key) {
        return React.createElement('span', {className: 'takekey', key: 'takekey'},
            gettextCatalog.getString(props.item.anpa_take_key));
    }
}

takekey.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
};
