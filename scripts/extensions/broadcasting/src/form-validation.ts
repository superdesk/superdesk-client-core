import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

export type IValidationResult = {valid: true} | {valid: false; errors: Array<string>};

export type CreateValidators<T> = {
    [Property in keyof T]: (value: T[Property]) => IValidationResult;
};

export function stringValidator(value: string): IValidationResult {
    if ((value ?? '').trim().length > 0) {
        return {valid: true};
    } else {
        return {valid: false, errors: [gettext('field can not be empty')]};
    }
}

export function numberValidator(value: number): IValidationResult {
    if (typeof value === 'number') {
        return {valid: true};
    } else {
        return {valid: false, errors: [gettext('field can not be empty')]};
    }
}
