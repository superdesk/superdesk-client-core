import {IFormGroup, IFormField, IFormGroupCollapsible} from 'superdesk-api';

export enum GenericFormFieldType {
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
    alert = 'alert',
    readonlyCopyableText = 'readonlyCopyableText',
}

export function isIFormField<T extends object>(x: IFormGroup<T>['form'][0]): x is IFormField<T> {
    return (x as IFormGroup<T>).direction == null;
}

export function isIFormGroupCollapsible<T extends object>(x: IFormGroup<T>['type']): x is IFormGroupCollapsible {
    const keys = Object.keys(x);

    return keys.length === 2 && keys.includes('label') && keys.includes('openByDefault');
}

export function isIFormGroup<T extends object>(x: IFormGroup<T>['form'][0]): x is IFormGroup<T> {
    const keys = Object.keys(x);

    return keys.length === 3 && keys.includes('direction') && keys.includes('type') && keys.includes('form');
}
