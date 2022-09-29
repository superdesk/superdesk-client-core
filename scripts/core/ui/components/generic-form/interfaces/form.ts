import {IFormGroup, IFormField, IFormGroupCollapsible} from 'superdesk-api';

export enum FormFieldType {
    plainText = 'plainText',
    duration = 'duration',
    textEditor3 = 'textEditor3',
    number = 'number',
    vocabularySingleValue = 'vocabularySingleValue',
    checkbox = 'checkbox',
    contentFilterSingleValue = 'contentFilterSingleValue',
    deskSingleValue = 'deskSingleValue',
    stageSingleValue = 'stageSingleValue',
    macroSingleValue = 'macroSingleValue',
    yesNo = 'yesNo',
    select = 'select',
    selectMultiple = 'selectMultiple',
}

export function isIFormField(x: IFormGroup['form'][0]): x is IFormField { // don't forget to update runtime type checks
    return x['direction'] == null;
}

export function isIFormGroupCollapsible(x: IFormGroup['type']): x is IFormGroupCollapsible {
    const keys = Object.keys(x);

    return keys.length === 2 && keys.includes('label') && keys.includes('openByDefault');
}

export function isIFormGroup(x: IFormGroup['form'][0]): x is IFormGroup {
    const keys = Object.keys(x);

    return keys.length === 3 && keys.includes('direction') && keys.includes('type') && keys.includes('form');
}
