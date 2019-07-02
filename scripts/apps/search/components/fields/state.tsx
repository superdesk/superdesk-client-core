import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {gettext} from 'core/utils';
import {removeLodash} from 'core/filters';

export const state: React.StatelessComponent<any> = (props) => {
    const datetime = props.datetime || props.svc.datetime;

    if (props.item.state !== undefined && props.item.state !== null) {
        let title = removeLodash(props.item.state);

        if (props.item.state === 'scheduled') {
            const scheduled = get(props.item, 'archive_item.schedule_settings.utc_publish_schedule');

            if (scheduled) {
                title = gettext('Scheduled for {{date}}', {date: datetime.longFormat(scheduled)});
            }
        }

        return (
            <span
                title={title}
                style={props.style || {}}
                className={'state-label state-' + props.item.state}
                key="state"
            >
                {removeLodash(gettext(props.item.state))}
            </span>
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
