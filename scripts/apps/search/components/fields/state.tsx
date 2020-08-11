import React from 'react';
import {get} from 'lodash';
import {gettext} from 'core/utils';
import {removeLodash} from 'core/filters';
import {IPropsItemListInfo} from '../ListItemInfo';
import {longFormat} from 'core/datetime/datetime';
import {IArticle, ITEM_STATE} from 'superdesk-api';

interface IProps {
    item: IArticle;
}

export function getStateLabel(state: ITEM_STATE) {
    switch (state) {
    case 'draft': return gettext('Draft');
    case 'ingested': return gettext('Ingested');
    case 'routed': return gettext('Routed');
    case 'fetched': return gettext('Fetched');
    case 'submitted': return gettext('Submitted');
    case 'in_progress': return gettext('In Progress');
    case 'spiked': return gettext('Spiked');
    case 'published': return gettext('Published');
    case 'scheduled': return gettext('Scheduled');
    case 'corrected': return gettext('Corrected');
    case 'killed': return gettext('Killed');
    case 'recalled': return gettext('Recalled');
    case 'unpublished': return gettext('Unpublished');
    }

    return state;
}

export const state: React.StatelessComponent<Pick<IPropsItemListInfo, 'item'>> = (props: IProps) => {
    if (props.item.state != null) {
        let title = getStateLabel(props.item.state);

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
                {title}
            </span>
        );
    } else {
        return null;
    }
};
