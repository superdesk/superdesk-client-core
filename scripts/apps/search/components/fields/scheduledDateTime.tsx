import React from 'react';
import {get} from 'lodash';
import {IPropsItemListInfo} from '../ListItemInfo';

export const scheduledDateTime: React.StatelessComponent<Pick<IPropsItemListInfo, 'item' | 'svc'>> = (props) => {
    const datetime = props.svc.datetime;

    if (props.item.state != null && props.item.state === 'scheduled') {
        const scheduled = get(props.item, 'archive_item.schedule_settings.utc_publish_schedule');

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
};
