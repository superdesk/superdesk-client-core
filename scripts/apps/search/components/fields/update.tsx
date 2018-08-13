import React from 'react';
import PropTypes from 'prop-types';

export const update:React.StatelessComponent<any> = (props) => {
    const {$interpolate, gettextCatalog} = props.svc;

    if (props.item.correction_sequence) {
        return React.createElement(
            'div',
            {
                className: 'provider',
                key: 'update',
                title: gettextCatalog.getString('correction sequence'),
            },
            $interpolate(
                gettextCatalog.getString('Update {{ seq }}'))({
                seq: props.item.correction_sequence,
            }
            )
        );
    }
};

update.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
