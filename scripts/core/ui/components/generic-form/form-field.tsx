import React from 'react';
import {TextSingleLine} from './input-types/text-single-line';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField, IFormGroup, isIFormGroup, isIFormField, FormFieldType} from './interfaces/form';
import {VocabularySingleValue} from './input-types/vocabulary_single_value';
import {TextEditor3} from './input-types/text-editor3';
import {noop} from 'lodash';
import {CheckboxInput} from './input-types/checkbox';
import {ContentFilterSingleValue} from './input-types/content-filter-single-value';
import {IInputType} from './interfaces/input-types';
import {DeskSingleValue} from './input-types/desk_single_value';
import {StageSingleValue} from './input-types/stage_single_value';
import {MacroSingleValue} from './input-types/macro_single_value';
import {YesNo} from './input-types/yes-no';

export function getFormFieldComponent(type: IFormField['type']): React.ComponentType<IInputType<any>> {
    switch (type) {
    case FormFieldType.textSingleLine:
        return TextSingleLine;
    case FormFieldType.textEditor3:
        return TextEditor3;
    case FormFieldType.vocabularySingleValue:
        return VocabularySingleValue;
    case FormFieldType.checkbox:
        return CheckboxInput;
    case FormFieldType.contentFilterSingleValue:
        return ContentFilterSingleValue;
    case FormFieldType.deskSingleValue:
        return DeskSingleValue;
    case FormFieldType.stageSingleValue:
        return StageSingleValue;
    case FormFieldType.macroSingleValue:
        return MacroSingleValue;
    case FormFieldType.yesNo:
        return YesNo;
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
            previewOutput={true}
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
