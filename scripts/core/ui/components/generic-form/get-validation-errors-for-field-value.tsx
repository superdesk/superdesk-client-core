/* eslint-disable no-case-declarations */

import {assertNever} from 'core/helpers/typescript-helpers';
import {FormFieldType} from './interfaces/form';
import {IFormField} from 'superdesk-api';
import {gettext, stripHtmlTags} from 'core/utils';

export function getValidationErrorsForFieldValue(fieldConfig: IFormField, value: any): Array<string> {
    const type: FormFieldType = fieldConfig.type;

    const fieldRequiredMsg = gettext('Field is required');

    let hasValue = true;

    switch (type) {
    case FormFieldType.textSingleLine:
        hasValue = typeof value === 'string' && value.trim().length > 0;

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else {
            return [];
        }

    case FormFieldType.textEditor3:
        hasValue = typeof value === 'string' && value.trim().length > 0 && stripHtmlTags(value).trim().length > 0;

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else {
            return [];
        }

    case FormFieldType.vocabularySingleValue:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.stageSingleValue:
    case FormFieldType.macroSingleValue:
        hasValue = typeof value === 'string' && value.trim().length > 0;

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else {
            return [];
        }

    case FormFieldType.yesNo:
        hasValue = typeof value === 'boolean';

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else {
            return [];
        }

    case FormFieldType.select:
        hasValue = value != null && value !== '';

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else {
            return [];
        }

    case FormFieldType.checkbox:
        hasValue = value === true || value === false;

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else {
            return [];
        }

    case FormFieldType.number:
        hasValue = typeof value === 'number' && !isNaN(value);

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else {
            return [];
        }

    case FormFieldType.arrayOf:
        hasValue = Array.isArray(value) && value.length > 0;

        if (fieldConfig.required && !hasValue) {
            return [fieldRequiredMsg];
        } else if (value.some((item) => item == null)) {
            return [gettext('List must not contain empty values')];
        } else {
            return [];
        }

    default:
        assertNever(type);
    }
}
