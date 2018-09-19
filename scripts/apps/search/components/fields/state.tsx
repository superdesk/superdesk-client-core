import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export const state: React.StatelessComponent<any> = (props) => {
    const {$filter, gettextCatalog, datetime} = props.svc;

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
                className: 'state-label state-' + props.item.state,
                key: 'state',
            },
            $filter('removeLodash')(gettextCatalog.getString(props.item.state)),
        );
    }
};

state.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
