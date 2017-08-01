import React from 'react';
import PropTypes from 'prop-types';

export function state(props) {
    const {$filter, gettextCatalog, datetime} = props.svc;

    if (props.item.state !== undefined && props.item.state !== null) {
        var title = $filter('removeLodash')(props.item.state);

        if (props.item.state === 'scheduled') {
            title = gettextCatalog.getString('Scheduled on ') + datetime.longFormat(props.item.publish_schedule);
        }

        return React.createElement(
            'span', {
                title: title,
                className: 'state-label state-' + props.item.state,
                key: 'state'
            },
            $filter('removeLodash')(gettextCatalog.getString(props.item.state))
        );
    }
}

state.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
