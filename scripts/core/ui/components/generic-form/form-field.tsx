import React from 'react';
import {TextSingleLine} from './input-types/text-single-line';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField, IFormGroup, isIFormGroup, isIFormField} from './interfaces/form';
import {VocabularySingleValue} from './input-types/vocabulary_single_value';
import {TextEditor3} from './input-types/text-editor3';
import {noop} from 'lodash';

export function getFormFieldComponent(type: IFormField['type']) {
    switch (type) {
    case 'text_single_line':
        return TextSingleLine;
    case 'text_editor3':
        return TextEditor3;
    case 'vocabulary_single_value':
        return VocabularySingleValue;
    default:
        assertNever(type);
    }
}

export function getFormFieldPreviewComponent(item: {[key: string]: any}, formFieldConfig: IFormField): JSX.Element {
    const Component = getFormFieldComponent(formFieldConfig.type);

    return (
        <Component
            previewOuput={true}
            value={item[formFieldConfig.field]}
            formField={formFieldConfig}
            disabled={false}
            issues={[]}
            onChange={noop}
        />
    );
}

export function getFormFieldsRecursive(form: Array<IFormField | IFormGroup>): Array<IFormField> {
    let result: Array<IFormField> = [];

    form.forEach((item) => {
        if (isIFormGroup(item)) {
            result = result.concat(getFormFieldsRecursive(item.form));
        } else if (isIFormField(item)) {
            result.push(item);
        } else {
            assertNever(item);
        }
    });

    return result;
}
