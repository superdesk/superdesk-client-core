import React from 'react';
import {PlainText} from './input-types/plain-text';
import {assertNever} from 'core/helpers/typescript-helpers';
import {isIFormGroup, isIFormField, GenericFormFieldType} from './interfaces/form';
import {VocabularySingleValue} from './input-types/vocabulary_single_value';
import {TextEditor3} from './input-types/text-editor3';
import {noop} from 'lodash';
import {CheckboxInput} from './input-types/checkbox';
import {ContentFilterSingleValue} from './input-types/content-filter-single-value';
import {IInputType} from './interfaces/input-types';
import {DeskSingleValue} from './input-types/desk_single_value';
import {StageSingleValue} from './input-types/stage_single_value';
import {getMacroSingleValue} from './input-types/macro_single_value';
import {YesNo} from './input-types/yes-no';
import {IFormField, IFormGroup} from 'superdesk-api';
import {SelectMultipleValues} from './input-types/select_multiple_values';
import {NumberComponent} from './input-types/number';
import {Select} from './input-types/select';
import {DurationComponent} from './input-types/duration';

export function getFormFieldComponent(type: GenericFormFieldType): React.ComponentType<IInputType<any>> {
    switch (type) {
        case GenericFormFieldType.plainText:
            return PlainText;
        case GenericFormFieldType.textEditor3:
            return TextEditor3;
        case GenericFormFieldType.number:
            return NumberComponent;
        case GenericFormFieldType.duration:
            return DurationComponent;
        case GenericFormFieldType.vocabularySingleValue:
            return VocabularySingleValue;
        case GenericFormFieldType.checkbox:
            return CheckboxInput;
        case GenericFormFieldType.contentFilterSingleValue:
            return ContentFilterSingleValue;
        case GenericFormFieldType.deskSingleValue:
            return DeskSingleValue;
        case GenericFormFieldType.stageSingleValue:
            return StageSingleValue;
        case GenericFormFieldType.macroSingleValue:
            return getMacroSingleValue();
        case GenericFormFieldType.yesNo:
            return YesNo;
        case GenericFormFieldType.select:
            return Select;
        case GenericFormFieldType.selectMultiple:
            return SelectMultipleValues;
        default:
            assertNever(type);
    }
}

export function getFormFieldPreviewComponent(
    item: {readonly [key: string]: any},
    formFieldConfig: IFormField<typeof item>,
    options: { showAsPlainText?: boolean } = {},
): JSX.Element {
    const Component = getFormFieldComponent(formFieldConfig.type);

    return (
        <Component
            showAsPlainText={!!options.showAsPlainText}
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

export function getFormFieldsRecursive<T extends object>(
    form: Array<IFormField<T> | IFormGroup<T>>,
): Array<IFormField<T>> {
    let result: Array<IFormField<T>> = [];

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
