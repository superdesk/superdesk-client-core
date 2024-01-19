import {IValidationResult} from '@superdesk/common';
import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

export function stringNotEmpty(value: string | null | undefined): IValidationResult {
    if ((value ?? '').trim().length > 0) {
        return null;
    } else {
        return gettext('field can not be empty');
    }
}

export function fieldNotNull(value: any): IValidationResult {
    if (value != null) {
        return null;
    } else {
        return gettext('field can not be empty');
    }
}

export const emptyValueError = gettext('field can not be empty');

export function greaterThanZero(value: number): IValidationResult {
    if (value > 1 !== true) {
        return gettext('value must be greater than zero');
    } else {
        return null;
    }
}
