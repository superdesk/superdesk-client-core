import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from 'core/utils';

export const state: React.StatelessComponent<any> = (props) => {
    // support passing services as props
    const $filter = props.$filter || props.svc.$filter;
    const datetime = props.datetime || props.svc.datetime;

    if (props.item.state !== undefined && props.item.state !== null) {
        let title = $filter('removeLodash')(props.item.state);

        if (props.item.state === 'scheduled') {
            const scheduled = get(props.item, 'archive_item.schedule_settings.utc_publish_schedule');

            if (scheduled) {
                title = gettext('Scheduled for {{date}}', {date: datetime.longFormat(scheduled)});
            }
        }

        return React.createElement(
            'span', {
                title: title,
                style: props.style || {},
                className: 'state-label state-' + props.item.state,
                key: 'state',
            },
            $filter('removeLodash')(gettext(props.item.state)),
        );
    }
};

state.propTypes = {
    svc: PropTypes.any,
    item: PropTypes.any,
    style: PropTypes.any,
    $filter: PropTypes.any,
    datetime: PropTypes.any,
};
