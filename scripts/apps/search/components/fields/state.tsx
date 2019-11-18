import React from 'react';
import {get} from 'lodash';
import {gettext} from 'core/utils';
import {removeLodash} from 'core/filters';
import {IPropsItemListInfo} from '../ListItemInfo';

export const state: React.StatelessComponent<Pick<IPropsItemListInfo, 'item' | 'svc'>> = (props) => {
    const datetime = props.svc.datetime;

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
                className={'state-label state-' + props.item.state}
                key="state"
            >
                {removeLodash(gettext(props.item.state))}
            </span>
        );
    } else {
        return null;
    }
};
