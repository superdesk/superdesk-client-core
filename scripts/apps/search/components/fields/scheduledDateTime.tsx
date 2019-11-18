import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

class ScheduledDateTime extends React.PureComponent<Pick<IPropsItemListInfo, 'item' | 'svc'>> {
    render() {
        const datetime = this.props.svc.datetime;
        const scheduled = this.props.item.archive_item
            ? this.props.item.archive_item.schedule_settings.utc_publish_schedule : null;

        if (this.props.item.state != null && this.props.item.state === 'scheduled' && scheduled != null) {
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
