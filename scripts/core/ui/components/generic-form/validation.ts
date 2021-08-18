import {IFormGroup} from 'superdesk-api';
import {getFormFieldsFlat} from './get-form-fields-flat';
import {hasValue} from './has-value';
import {gettext} from 'core/utils';

export type IGenericFormValidationErrors = {[field: string]: Array<string>};

export function getValidationErrors(
    formConfig: IFormGroup,
    item: Dictionary<string, any>,
): IGenericFormValidationErrors {
    const fieldsFlat = getFormFieldsFlat(formConfig);
    const notFilled = fieldsFlat.filter(
        (fieldConfig) => fieldConfig.required && !hasValue(fieldConfig, item[fieldConfig.field]),
    );

    if (notFilled.length > 0) {
        return notFilled.reduce<IGenericFormValidationErrors>((acc, fieldConfig) => {
            acc[fieldConfig.field] = [gettext('Field is required')];

            return acc;
        }, {});
    } else {
        return {};
    }
}
