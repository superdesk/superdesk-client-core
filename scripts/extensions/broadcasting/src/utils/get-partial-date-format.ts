import {superdesk} from '../superdesk';

/**
 * https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes
 */
export function toPythonDateFormat(
    dateTemplate: string, // superdesk format from config.view.dateformat
) {
    let result = dateTemplate;

    result = result.replace('YYYY', '%Y');
    result = result.replace('MM', '%m');
    result = result.replace('DD', '%d');

    return result;
}

export function toSuperdeskDateFormat(
    dateTemplate: string, // python format
): string { // returns superdesk format from config.view.dateformat
    let result = dateTemplate;

    result = result.replace('%Y', 'YYYY');
    result = result.replace('%m', 'MM');
    result = result.replace('%d', 'DD');

    return result;
}

export function getPartialDateFormat(parts: {year?: boolean; month?: boolean; day?: boolean}): string {
    const separator = superdesk.instance.config.view.dateformat
        .replace('YYYY', '')
        .replace('MM', '')
        .replace('DD', '')[0];

    const removeSegment = (dateFormat: string, segment: 'YYYY' | 'MM' | 'DD'): string => {
        const segmentIndex = dateFormat.indexOf(segment);
        const separatorBefore: boolean = dateFormat[segmentIndex - 1] === separator;
        const separatorAfter: boolean = dateFormat[segmentIndex + segment.length] === separator;

        const toRemove = dateFormat.slice(
            segmentIndex + (separatorBefore ? -1 : 0),
            segmentIndex + segment.length + (separatorAfter ? 1 : 0),
        );

        return dateFormat.replace(toRemove, '');
    };

    let result = superdesk.instance.config.view.dateformat;

    if (parts.year !== true) {
        result = removeSegment(result, 'YYYY');
    }

    if (parts.month !== true) {
        result = removeSegment(result, 'MM');
    }

    if (parts.day !== true) {
        result = removeSegment(result, 'DD');
    }

    return result;
}
