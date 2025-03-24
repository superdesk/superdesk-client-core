import {IAvailabilityRecord} from './interfaces';
import {superdesk} from './superdesk';

export const TAGS_VOCABULARY_ID = 'availability_manager_tags';

const {gettext} = superdesk.localization;
const {assertNever} = superdesk.helpers;

const statusesObj: {[key in IAvailabilityRecord['status']]: 1} = {
    available: 1,
    unavailable: 1,
    partial: 1,
};

export const availabilityStatuses = Object.keys(statusesObj) as Array<IAvailabilityRecord['status']>;

export function getLabelForStatus(status: IAvailabilityRecord['status']) {
    switch(status) {
        case 'available':
            return gettext('Available');
        case 'unavailable':
            return gettext('Unavailable');
        case 'partial':
            return gettext('Partially available');
        default:
            return assertNever(status);
    }
}
