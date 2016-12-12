import React from 'react';

export function expiry(props) {
    const {gettext, datetime} = props.svc;

    if (props.item.is_spiked) {
        return React.createElement(
            'div',
            {className: 'expires', key: 'expiry'},
            gettext('expires') + ' ' + datetime.shortFormat(props.item.expiry)
        );
    }
}

expiry.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
};
