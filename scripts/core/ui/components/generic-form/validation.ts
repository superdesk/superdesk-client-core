import {IFormGroup} from 'superdesk-api';
import {getFormFieldsFlat} from './get-form-fields-flat';
import {getValidationErrorsForFieldValue} from './get-validation-errors-for-field-value';

export type IGenericFormValidationErrors = {[field: string]: Array<string>};

export function getValidationErrors(
    formConfig: IFormGroup,
    item: Dictionary<string, any>,
): IGenericFormValidationErrors {
    const fieldsFlat = getFormFieldsFlat(formConfig);

    const errorsForFields = fieldsFlat
        .map((fieldConfig) => ({fieldConfig: fieldConfig, errors: getValidationErrorsForFieldValue(fieldConfig, item[fieldConfig.field])}))
        .filter(({errors}) => errors.length > 0)
        .reduce<IGenericFormValidationErrors>((acc, {fieldConfig, errors}) => {
            acc[fieldConfig.field] = errors;

            return acc;
        }, {});


    return errorsForFields;
}
