import {IFormGroup, IFormField, IFormGroupCollapsible} from 'superdesk-api';

export enum GenericFormFieldType {
    /**
     * Free text. Optional `component_parameters`: `multiline` renders a textarea,
     * `password` masks the input, `info` is a persistent hint shown below the input
     * while the field has no error. `multiline` wins when `multiline` and `password`
     * are both set.
     */
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

    /**
     * Single value picked from options fetched when the field mounts.
     * `component_parameters` must match `ISelectAsyncParameters`
     * (`input-types/select_async.tsx`): `getOptions(formValues)` and optional `dependentFields`.
     * When `getOptions` rejects, the field falls back to a text input holding the current value,
     * so the value can still be typed by hand and the form saved.
     */
    selectAsync = 'selectAsync',

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
