export interface IFormField { // don't fortget to update runtime type checks
    type: 'text_single_line' | 'text_editor3' | 'vocabulary_single_value';
    required?: boolean;

    // custom components for some fields might not require a label or want include a custom one
    label?: string;

    // field which will be updated in case of 1 to 1 mapping
    // it is nullable since complex components might want to update multiple fields
    // for example a person widget would update first_name, last_name and is_active fields
    field?: string;

    // can be used to pass read-only fields or display specific flags
    // component theme, variant or initial state could be set using this
    component_parameters?: {[key: string]: any};
}

export function isIFormField(x: IFormGroup['form'][0]): x is IFormField { // don't fortget to update runtime type checks
    return x['direction'] == null;
}

//

export interface IFormGroupCollapsible { // don't fortget to update runtime type checks
    label: string;
    openByDefault: boolean;
}

export function isIFormGroupCollapsible(x: IFormGroup['type']): x is IFormGroupCollapsible {
    return typeof x === 'object' && JSON.stringify(Object.keys(x)) === '["label","openByDefault"]';
}

//

export interface IFormGroup { // don't fortget to update runtime type checks
    direction: 'vertical' | 'horizontal';
    type: 'inline' | IFormGroupCollapsible;
    form: Array<IFormField | IFormGroup>;
}

export function isIFormGroup(x: IFormGroup['form'][0]): x is IFormGroup {
    return JSON.stringify(Object.keys(x)) === '["direction","type","form"]';
}
