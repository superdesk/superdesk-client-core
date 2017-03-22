import React from 'react';

export function state(props) {
    const {$filter, gettextCatalog} = props.svc;

    if (props.item.state !== undefined && props.item.state !== null) {
        return React.createElement(
            'span', {
                title: $filter('removeLodash')(props.item.state),
                className: 'state-label state-' + props.item.state,
                key: 'state'
            },
            $filter('removeLodash')(gettextCatalog.getString(props.item.state))
        );
    }
}

state.propTypes = {
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
};
