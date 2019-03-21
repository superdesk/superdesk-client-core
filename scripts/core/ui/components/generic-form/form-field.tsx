import React from 'react';
import {TextSingleLine} from './input-types/text-single-line';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField, IFormGroup, isIFormGroup, isIFormField} from './interfaces/form';
import {VocabularySingleValue} from './input-types/vocabulary_single_value';
import {TextEditor3} from './input-types/text-editor3';
import {noop} from 'lodash';
import {CheckboxInput} from './input-types/checkbox';
import {ContentFilterSingleValue} from './input-types/content-filter-single-value';
import {DeskStageMacro} from './input-types/desk-stage-macro';
import {IInputType} from './interfaces/input-types';

export function getFormFieldComponent(type: IFormField['type']): React.ComponentType<IInputType<any>> {
    switch (type) {
    case 'text_single_line':
        return TextSingleLine;
    case 'text_editor3':
        return TextEditor3;
    case 'vocabulary_single_value':
        return VocabularySingleValue;
    case 'checkbox':
        return CheckboxInput;
    case 'content_filter_single_value':
        return ContentFilterSingleValue;
    case 'desk_stage_macro':
        return DeskStageMacro;
    default:
        assertNever(type);
    }
}

export function getFormFieldPreviewComponent(
    item: {readonly [key: string]: any},
    formFieldConfig: IFormField,
): JSX.Element {
    const Component = getFormFieldComponent(formFieldConfig.type);

    return (
        <Component
            formValues={item}
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
