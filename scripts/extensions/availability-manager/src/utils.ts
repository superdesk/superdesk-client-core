import {IAvailabilityRecord} from './interfaces';
import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;
const {assertNever} = superdesk.helpers;

export function getLocalizedDateString(localeCode: string, date: Date) {
    return new Intl.DateTimeFormat(localeCode, {
        year: 'numeric',
        month: 'long',
        weekday: 'long',
        day: 'numeric',
    }).format(date);
}

export function getStatusColor(status: IAvailabilityRecord['status']) {
    if (status === 'available') {
        return 'var(--color-success-highlight)';
    } else if (status === 'unavailable') {
        return 'var(--color-alert-highlight)';
    } else if (status === 'partial') {
        return 'var(--color-warning-highlight)';
    } else {
        return assertNever(status);
    }
}

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
