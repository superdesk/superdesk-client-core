import {getTimezoneLabels} from 'apps/dashboard/world-clock/timezones-all-labels';
import {OrderedMap} from 'immutable';

/**
 * Returns translated labels of time zones indexed by time zone IDs
 */
function getTimeZones(): OrderedMap<string, string> {
    let result = OrderedMap<string, string>();

    for (const [id, label] of Object.entries(getTimezoneLabels())) {
        result = result.set(id, label);
    }

    return result;
}

export const time = {
    getTimeZones,
};
