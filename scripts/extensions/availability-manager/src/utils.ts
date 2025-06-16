import {formatTime, mergeSets, omit} from '@sourcefabric/common';
import type {OmitStrict} from '@sourcefabric/common';
import {format} from 'date-fns';
import {IBaseRestApiResponse, IVocabularyItem} from 'superdesk-api';
import {TAGS_VOCABULARY_ID} from './constants';
import {
    IAvailabilityRecord,
    IAvailabilityAllDay,
    IAvailabilityPartial,
    IDefaultAvailability,
    IScheduleRecord,
    IWorkingHours,
} from './interfaces';
import {superdesk} from './superdesk';

const {httpRequestJsonLocal} = superdesk;
const {gettext, formatDateTime} = superdesk.localization;
const {assertNever} = superdesk.helpers;
const {omitBaseApiResponse, filterFlatTree} = superdesk.utilities;

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

export function getTextColorForStatus(status: IAvailabilityRecord['status']) {
    if (status === 'available') {
        return 'var(--sd-colour-success--text)';
    } else if (status === 'unavailable') {
        return 'var(--sd-colour-alert--text)';
    } else if (status === 'partial') {
        return 'var(--sd-colour-warning--text)';
    } else {
        return assertNever(status);
    }
}

export function getLabelForStatus(status: IAvailabilityRecord['status']) {
    switch (status) {
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

/**
 * In daily/weekly dashboard views status labels are different
 */
export function getDashboardLabelForStatus(status: IAvailabilityRecord['status']) {
    switch (status) {
        case 'available':
            return gettext('Available all day');
        case 'unavailable':
            return gettext('Unavailable');
        case 'partial':
            return gettext('Available');
        default:
            return assertNever(status);
    }
}

export function getStylesForStatusDot(status: IAvailabilityRecord['status']): React.CSSProperties {
    return {
        width: '1.6rem',
        height: '1.6rem',
        borderRadius: 9999,
        whiteSpace: 'nowrap',
        background: getStatusColor(status),
    };
}

export function validateWorkingHours(workingHours: Array<IWorkingHours>, localeCode: string): string | null {
    for (const range of workingHours) {
        const {start_time, end_time} = range;

        if (start_time == null || start_time.length < 1) {
            return gettext('{{field}} cannot be empty', {field: gettext('start time')});
        } else if (end_time == null || end_time.length < 1) {
            return gettext('{{field}} cannot be empty', {field: gettext('end time')});
        } else if (new Date(`1970-01-01 ${start_time}`) > new Date(`1970-01-01 ${end_time}`)) {
            return gettext(
                'start time cannot be greater than end time ({{start_time}} - {{end_time}})',
                {start_time: formatTime(start_time, localeCode), end_time: formatTime(end_time, localeCode)},
            );
        }
    }

    return null;
}

export function validateAvailabilityRecord(record: IScheduleRecord, localeCode: string): string | null {
    if (record.status == null) {
        return gettext('{{field}} cannot be empty', {field: gettext('status')});
    }

    if (record.status === 'partial' && (record.working_hours ?? []).length < 1) {
        return gettext('working hours are not set');
    }

    if (record.status === 'partial') {
        const result = validateWorkingHours((record.working_hours ?? []), localeCode);

        if (result != null) {
            return result;
        }
    }

    return null;
}

export function validateSchedule(
    schedule: {[weekDayIndex: string]: IScheduleRecord},
    localeCode: string,
): {[weekdayIndex: string]: string} {
    const errors: ReturnType<typeof validateSchedule> = {};

    for (const [key, value] of Object.entries(schedule)) {
        const validationResult = validateAvailabilityRecord(value, localeCode);

        if (validationResult != null) {
            errors[key] = validationResult;
        }
    }

    return errors;
}

export function getModifiedBySomeoneElseWarning(
    workingDay: IAvailabilityRecord | null,
): string | null {
    const allUsers = superdesk.entities.users.getAllUsers();

    if (
        workingDay != null
        && workingDay.last_updated_by != null
        && workingDay.last_updated_by !== workingDay.user
    ) {
        return gettext(
            'Modified by {{user}} at {{date}}',
            {
                user: allUsers[workingDay.last_updated_by].display_name,
                date: formatDateTime(new Date(workingDay._updated)),
            },
        );
    } else {
        return null;
    }
}

export function setUserAvailability(
    userId: string,
    currentAvailability: IDefaultAvailability | null,
    patch: Partial<IDefaultAvailability>,
): Promise<IDefaultAvailability> {
    const initialDefaultAvailability: OmitStrict<IDefaultAvailability, 'user' | keyof IBaseRestApiResponse> = {
        working_days: {},
        language: [],
        tags: [],
        enabled: false,
    };

    return httpRequestJsonLocal<IDefaultAvailability>({
        method: 'PUT',
        path: `/default_user_availability/${userId}`,
        payload: {
            // "user" property needs to be omitted because it's already in the path
            ...(
                currentAvailability == null
                    ? initialDefaultAvailability
                    : omit(omitBaseApiResponse(currentAvailability), 'user')
            ),
            ...patch,
        } satisfies Partial<IDefaultAvailability>,
        headers: currentAvailability == null ? {} : {
            'If-Match': currentAvailability._etag,
        },
    });
}

export function getFilteredTags(alreadySelected: Set<string>, tagsWhitelist: Set<string>): Array<IVocabularyItem> {
    const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);

    if (tagsWhitelist.size < 1) {
        return tagsVocabulary.items;
    } else {
        const itemsToInclude = mergeSets(tagsWhitelist, alreadySelected);

        return filterFlatTree({
            itemsFlat: tagsVocabulary.items,
            filterFn: (item) => itemsToInclude.has(item.qcode),
            getId: (item) => item.qcode,
            getParentId: (item) => item.parent,
            includeParents: false,
        });
    }
}

export function getAvailabilityRecordBaseFields(status: IAvailabilityRecord['status']): Array<string> {
    if (status === 'partial') {
        return Object.keys({
            date: 1,
            status: 1,
            working_hours: 1,
        } satisfies {[key in keyof Required<IAvailabilityPartial>]: 1});
    } else if (status === 'available' || status === 'unavailable') {
        return Object.keys({
            date: 1,
            status: 1,
            working_hours: 1,
        } satisfies {[key in keyof Required<IAvailabilityAllDay>]: 1});
    } else {
        return assertNever(status);
    }
}

export const fullWidthNoGrow: React.CSSProperties = {
    width: 'min-content',
    minWidth: '100%',
};

export function compareTime(
    str1: string,
    str2: string,
): number {
    const num1 = parseInt(str1.replace(':', ''), 10);
    const num2 = parseInt(str2.replace(':', ''), 10);

    if (num1 < num2) {
        return -1;
    } else if (num1 === num2) {
        return 0;
    } else {
        return 1;
    }
}

export function getTimeNumber(
    time: string, // ISO time e.g. 23:59
) {
    return parseInt(time.replace(':', ''), 10);
}

/**
 * Only formats to ISO 8601, doesn't convert it.
 */
export function formatDateIso(date: Date) {
    return format(date, 'yyyy-MM-dd');
}
