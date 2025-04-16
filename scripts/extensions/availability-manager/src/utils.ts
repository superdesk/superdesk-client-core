import {formatTime, mergeSets} from '@sourcefabric/common';
import {IVocabularyItem} from 'superdesk-api';
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
const {gettext} = superdesk.localization;
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

        if (start_time.length < 1) {
            return gettext('{{field}} cannot be empty', {field: gettext('start time')});
        } else if (end_time.length < 1) {
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

export function validateSchedule(
    schedule: {[weekDayIndex: string]: IScheduleRecord},
    localeCode: string,
): {[weekdayIndex: string]: string} {
    const errors: ReturnType<typeof validateSchedule> = {};

    for (const [key, value] of Object.entries(schedule)) {
        const setError = (error: string) => errors[key] = error;

        if (value.status == null) {
            setError(
                gettext('{{field}} cannot be empty', {field: gettext('status')}),
            );
        }

        if (value.status === 'partial' && (value.working_hours ?? []).length < 1) {
            setError(gettext('working hours are not set'));
        }

        if (value.status === 'partial') {
            const result = validateWorkingHours((value.working_hours ?? []), localeCode);

            if (result != null) {
                setError(result);
            }
        }
    }

    return errors;
}

export function setUserAvailability(
    userId: string,
    currentAvailability: IDefaultAvailability | null,
    patch: Partial<IDefaultAvailability>,
): Promise<IDefaultAvailability> {
    return httpRequestJsonLocal<IDefaultAvailability>({
        method: 'PUT',
        path: `/default_user_availability/${userId}`,
        payload: {
            ...(
                currentAvailability == null
                    ? {}
                    : omitBaseApiResponse(currentAvailability)
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
