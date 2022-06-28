import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

export type IValidationResult = string | null;

export type CreateValidators<T> = {
    [Property in keyof T]: (value: T[Property]) => IValidationResult;
};

export function stringNotEmpty(value: string | null | undefined): IValidationResult {
    if ((value ?? '').trim().length > 0) {
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
