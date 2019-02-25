import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';

export const expiry: React.StatelessComponent<any> = (props) => {
    const {datetime} = props.svc;

    if (props.item.is_spiked) {
        return React.createElement(
            'div',
            {className: 'expires', key: 'expiry'},
            gettext('expires') + ' ' + datetime.shortFormat(props.item.expiry),
        );
    }
};

expiry.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
