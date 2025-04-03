import {IAvailabilityRecord} from './interfaces';

export const TAGS_VOCABULARY_ID = 'availability_manager_tags';
export const LANGUAGES_VOCABULARY = 'languages';

const statusesObj: {[key in IAvailabilityRecord['status']]: 1} = {
    available: 1,
    unavailable: 1,
    partial: 1,
};

export const availabilityStatuses = Object.keys(statusesObj) as Array<IAvailabilityRecord['status']>;

export const dayCodes = {
    '0': 'sunday',
    '1': 'monday',
    '2': 'tuesday',
    '3': 'wednesday',
    '4': 'thursday',
    '5': 'friday',
    '6': 'saturday',
} as const;

export const dayIndexesByDayCode: {[key: string]: string} = {
    'sunday': '0',
    'monday': '1',
    'tuesday': '2',
    'wednesday': '3',
    'thursday': '4',
    'friday': '5',
    'saturday': '6',
};

export type IDayIndex = keyof typeof dayCodes;