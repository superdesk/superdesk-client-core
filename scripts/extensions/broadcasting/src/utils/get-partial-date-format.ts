import {superdesk} from '../superdesk';

export function getPartialDateFormat(parts: {year?: boolean; month?: boolean; day?: boolean}) {
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