import React from 'react';
import {get} from 'lodash';
import {gettext} from 'core/utils';
import {removeLodash} from 'core/filters';
import {IPropsItemListInfo} from '../ListItemInfo';
import {longFormat} from 'core/datetime/datetime';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
}

export const state: React.StatelessComponent<Pick<IPropsItemListInfo, 'item' | 'svc'>> = (props: IProps) => {
    if (props.item.state != null) {
        let title = removeLodash(gettext(props.item.state));

        if (props.item.state === 'scheduled') {
            const scheduled = props.item.archive_item?.schedule_settings?.utc_publish_schedule;

            if (scheduled != null) {
                title = gettext('Scheduled for {{date}}', {date: longFormat(scheduled)});
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
