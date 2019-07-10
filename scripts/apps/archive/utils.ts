import {PUBLISH_STATES, SCHEDULED, KILLED_STATES} from './constants';

export const isPublished = (item, includeScheduled = true) =>
    PUBLISH_STATES.includes(item.state) && (includeScheduled || item.state !== SCHEDULED);

export const isKilled = (item) =>
    KILLED_STATES.includes(item.state);
