import React from 'react';
import {gettext} from 'core/utils';
import {assertNever} from 'core/helpers/typescript-helpers';
import {ITEM_STATE} from 'apps/archive/constants';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {StateLabel} from 'superdesk-ui-framework';
import {IArticle} from 'superdesk-api';
import moment from 'moment-timezone';

function isScheduledTimeInFuture(item: IArticle): boolean {
    const scheduledTime = item.schedule_settings?.utc_publish_schedule;

    return scheduledTime != null && moment(scheduledTime).isAfter(moment.utc());
}

export function getStateLabel(item: IArticle) {
    if (isScheduledTimeInFuture(item)) {
        return ITEM_STATE.SCHEDULED;
    }

    /**
     * We use an explicit type annotation here to ensure proper type narrowing is achieved in the switch statement.
     * We do this because we can't have enum values imported from `superdesk-api.d.ts`,
     * and we also can't import ITEM_STATE enum from `apps/archive/constants` in `superdesk-api.d.ts`
     * because type checking breaks.
     */
    const itemState: ITEM_STATE = item.state;

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

interface IStateComponentProps {
    item: IArticle;
    clickable?: boolean;
}

export const StatusInfo = (props: IStateComponentProps) => {
    const {item, clickable = true} = props;

    if (item.state == null) {
        return null;
    }

    const openItem = () => {
        openArticle(item._id, 'view');
    };

    const handleClick = clickable && item.state === 'being_corrected'
        ? openItem
        : undefined;

    return (
        <StateLabel
            state={isScheduledTimeInFuture(item) ? ITEM_STATE.SCHEDULED : item.state}
            text={getStateLabel(item)}
            onClick={handleClick}
        />
    );
};

export const state = StatusInfo;
