export interface IFormField { // don't forget to update runtime type checks
    type: 'text_single_line'
        | 'text_editor3'
        | 'vocabulary_single_value'
        | 'checkbox'
        | 'content_filter_single_value'
        | 'desk_single_value'
        | 'stage_single_value'
        | 'macro_single_value'
        | 'yes_no'
    ;

    required?: boolean;

    // custom components for some fields might not require a label or want include a custom one
    label?: string;

    field: string;

    // can be used to pass read-only fields or display specific flags
    // component theme, variant or initial state could be set using this
    component_parameters?: {[key: string]: any};
}

export function isIFormField(x: IFormGroup['form'][0]): x is IFormField { // don't forget to update runtime type checks
    return x['direction'] == null;
}

//

export interface IFormGroupCollapsible { // don't forget to update runtime type checks
    label: string;
    openByDefault: boolean;
}

export function isIFormGroupCollapsible(x: IFormGroup['type']): x is IFormGroupCollapsible {
    return typeof x === 'object' && JSON.stringify(Object.keys(x)) === '["label","openByDefault"]';
}

//

export interface IFormGroup { // don't forget to update runtime type checks
    direction: 'vertical' | 'horizontal';
    type: 'inline' | IFormGroupCollapsible;
    form: Array<IFormField | IFormGroup>;
}

export function isIFormGroup(x: IFormGroup['form'][0]): x is IFormGroup {
    const keys = Object.keys(x);

    return keys.length === 3 && keys.includes('direction') && keys.includes('type') && keys.includes('form');
}
