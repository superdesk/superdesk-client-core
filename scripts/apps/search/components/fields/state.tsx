import React from 'react';
import {get} from 'lodash';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {removeLodash} from 'core/filters';
import {IPropsItemListInfo} from '../ListItemInfo';
import {longFormat} from 'core/datetime/datetime';
import {IArticle} from 'superdesk-api';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ITEM_STATE} from 'apps/search/interfaces';

export function getStateLabel(itemState: ITEM_STATE) {
    switch (itemState) {
    case ITEM_STATE.DRAFT: return gettext('Draft');
    case ITEM_STATE.INGESTED: return gettext('Ingested');
    case ITEM_STATE.ROUTED: return gettext('Routed');
    case ITEM_STATE.FETCHED: return gettext('Fetched');
    case ITEM_STATE.SUBMITTED: return gettext('Submitted');
    case ITEM_STATE.IN_PROGRESS: return gettext('In Progress');
    case ITEM_STATE.SPIKED: return gettext('Spiked');
    case ITEM_STATE.PUBLISHED: return gettext('Published');
    case ITEM_STATE.SCHEDULED: return gettext('Scheduled');
    case ITEM_STATE.CORRECTED: return gettext('Corrected');
    case ITEM_STATE.CORRECTION: return gettext('Correction');
    case ITEM_STATE.BEING_CORRECTED: return gettext('Being Corrected');
    case ITEM_STATE.KILLED: return gettext('Killed');
    case ITEM_STATE.RECALLED: return gettext('Recalled');
    case ITEM_STATE.UNPUBLISHED: return gettext('Unpublished');
    default: assertNever(itemState);
    }
}

interface IProps {
    item: IArticle;
}

export const state: React.StatelessComponent<Pick<IPropsItemListInfo, 'item'>> = (props: IProps) => {

    if (props.item.state != null) {
        let title = getStateLabel(props.item.state);
        const text = title;
        const openItem = function(event) {
            event.stopPropagation();
            props.openAuthoringView(props.item.archive_item.correction_by);
        };

        if (props.item.state === 'scheduled') {
            const scheduled = props.item.archive_item?.schedule_settings?.utc_publish_schedule;

            if (scheduled != null) {
                title = gettext('Scheduled for {{date}}', {date: longFormat(scheduled)});
            }
        }

        return (
            <span
                title={title}
                className={props.item.state === 'correction' && appConfig?.corrections_workflow
                    ? 'label pink--500'
                    : (props.item.state === 'being_corrected'
                    ? 'label label--hollow hollow-pink--500'
                    : 'state-label state-' + props.item.state)}
                key="state"
                onClick={props.item.state === 'being_corrected' ? openItem : null}
            >
                {text}
            </span>
        );
    } else {
        return null;
    }
};
