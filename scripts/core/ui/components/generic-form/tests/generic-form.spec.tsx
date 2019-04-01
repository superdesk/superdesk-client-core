import React from 'react';
import {render} from 'enzyme';
import {IFormField, FormFieldType} from '../interfaces/form';
import {noop} from 'lodash';
import {getFormFieldComponent} from '../form-field';
import {assertNever} from 'core/helpers/typescript-helpers';

function getAllInputTypes(): Array<FormFieldType> {
    return Object.keys(FormFieldType).map((key) => FormFieldType[key]);
}

function getTestFieldConfig(type: IFormField['type']): IFormField {
    switch (type) {
    case FormFieldType.textSingleLine:
    case FormFieldType.textEditor3:
    case FormFieldType.vocabularySingleValue:
    case FormFieldType.checkbox:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.yesNo:
        return {
            type: type,
            field: 'test-field',
        };
    case FormFieldType.stageSingleValue:
    case FormFieldType.macroSingleValue:
        return {
            type: type,
            field: 'test-field',
            component_parameters: {
                deskField: 'test-desk-field',
            },
        };
    default:
        assertNever(type);
    }
}

describe('generic form', () => {
    const message = 'error-q7w8e9r';

    getAllInputTypes()
        .forEach((type: FormFieldType) => {
            it(`${type} should render error messages`, () => {
                const Component = getFormFieldComponent(type);

                const wrapper = render(
                    <div>
                        <Component
                            formField={getTestFieldConfig(type)}
                            formValues={{}}
                            disabled={false}
                            value=""
                            issues={[message]}
                            previewOutput={false}
                            onChange={noop}
                        />
                    </div>,
                );

                expect(wrapper.find('.sd-line-input--invalid').length).toBe(1);
                expect(wrapper.html()).toContain(message);
            });
        });

    getAllInputTypes()
        .forEach((type: FormFieldType) => {
            it(`${type} should add a classname for required fields`, () => {
                const Component = getFormFieldComponent(type);

                const wrapper = render(
                    <div>
                        <Component
                            formField={{...getTestFieldConfig(type), required: true}}
                            formValues={{}}
                            disabled={false}
                            value=""
                            issues={[]}
                            previewOutput={false}
                            onChange={noop}
                        />
                    </div>,
                );

                expect(wrapper.find('.sd-line-input--required').length).toBe(1);
            });
        });
});
