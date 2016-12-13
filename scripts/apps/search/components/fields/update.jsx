import React from 'react';

export function update(props) {
    const {$interpolate, gettextCatalog} = props.svc;

    if (props.item.correction_sequence) {
        return React.createElement(
            'div',
            {
                className: 'provider',
                key: 'update',
                title: gettextCatalog.getString('correction sequence')
            },
            $interpolate(
                gettextCatalog.getString('Update {{ seq }}'))({
                    seq: props.item.correction_sequence
                }
            )
        );
    }
}

update.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
};
