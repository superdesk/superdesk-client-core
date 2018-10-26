import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export const state: React.StatelessComponent<any> = (props) => {
    // support passing services as props
    const $filter = props.$filter || props.svc.$filter;
    const gettextCatalog = props.gettextCatalog || props.svc.gettextCatalog;
    const datetime = props.datetime || props.svc.datetime;

    if (props.item.state !== undefined && props.item.state !== null) {
        let title = $filter('removeLodash')(props.item.state);

        if (props.item.state === 'scheduled') {
            const scheduled = get(props.item, 'archive_item.schedule_settings.utc_publish_schedule');

            if (scheduled) {
                title = gettextCatalog.getString('Scheduled for') + ' ' + datetime.longFormat(scheduled);
            }
        }

        return React.createElement(
            'span', {
                title: title,
                style: props.style || {},
                className: 'state-label state-' + props.item.state,
                key: 'state',
            },
            $filter('removeLodash')(gettextCatalog.getString(props.item.state)),
        );
    }
};

state.propTypes = {
    svc: PropTypes.any,
    item: PropTypes.any,
    style: PropTypes.any,
    $filter: PropTypes.any,
    gettextCatalog: PropTypes.any,
    datetime: PropTypes.any,
};
