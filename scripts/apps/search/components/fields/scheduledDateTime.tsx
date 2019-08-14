import React from 'react';
import {get} from 'lodash';
import {IPropsItemListInfo} from '../ListItemInfo';

class ScheduledDateTime extends React.PureComponent<Pick<IPropsItemListInfo, 'item' | 'svc'>> {
    render() {
        const datetime = this.props.svc.datetime;

        if (this.props.item.state != null && this.props.item.state === 'scheduled') {
            const scheduled = get(this.props.item, 'archive_item.schedule_settings.utc_publish_schedule');

            return (
                <span
                    key="scheduledDateTime"
                    style={{color: '#da7200', marginRight: 4}}
                >
                    { datetime.scheduledFormat(scheduled) }
                </span>
            );
        } else {
            return null;
        }
    }
}

export const scheduledDateTime = ScheduledDateTime;
