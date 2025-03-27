import {IAvailabilityRecord} from './interfaces';

export const TAGS_VOCABULARY_ID = 'availability_manager_tags';

const statusesObj: {[key in IAvailabilityRecord['status']]: 1} = {
    available: 1,
    unavailable: 1,
    partial: 1,
};

export const availabilityStatuses = Object.keys(statusesObj) as Array<IAvailabilityRecord['status']>;
