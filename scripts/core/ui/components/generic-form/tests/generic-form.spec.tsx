import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
import {getFormFieldComponent} from '../form-field';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField} from 'superdesk-api';
import {FormFieldType} from '../interfaces/form';
import {mockDataApi} from 'core/tests/mockDataApi';

function getAllInputTypes(): Array<FormFieldType> {
    return Object.keys(FormFieldType).map((key) => FormFieldType[key]);
}

function getTestFieldConfig(type: FormFieldType): IFormField {
    switch (type) {
    case FormFieldType.textSingleLine:
    case FormFieldType.textEditor3:
    case FormFieldType.number:
    case FormFieldType.checkbox:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.yesNo:
        return {
            type: type,
            field: 'test-field',
        };
    case FormFieldType.vocabularySingleValue:
        return {
            type: type,
            field: 'test-field',
            component_parameters: {
                vocabulary_id: 'test_vocabulary_id',
            },
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
    case FormFieldType.select:
        return {
            type: type,
            field: 'test-field',
            component_parameters: {
                options: [
                    {id: 'test', label: 'test'},
                ],
            },
        };
    case FormFieldType.arrayOf:
        return {
            type: type,
            field: 'test-field',
            component_parameters: {
                field_type: FormFieldType.number,
            },
        };
    default:
        assertNever(type);
    }
}

describe('generic form', () => {
    const message = 'error-q7w8e9r';

    beforeEach(mockDataApi);

    getAllInputTypes()
        .forEach((type: FormFieldType) => {
            it(`${type} should render error messages`, (done) => {
                const Component = getFormFieldComponent(type);

                const wrapper = mount(
                    <div>
                        <Component
                            formField={getTestFieldConfig(type)}
                            formValues={{}}
                            disabled={false}
                            value={undefined}
                            issues={[message]}
                            previewOutput={false}
                            onChange={noop}
                        />
                    </div>,
                );

                setTimeout(() => { // wait for data fetching (only used by some input types)
                    wrapper.update();
                    expect(wrapper.find('.sd-line-input--invalid').length).toBe(1);
                    expect(wrapper.html()).toContain(message);

                    done();
                }, 100);
            });
        });

    getAllInputTypes()
        /**
         * `arrayOf` can't add that classname, because due to current CSS,
         * all children would be marked as required even if they are not.
         */
        .filter((type) => type !== FormFieldType.arrayOf)

        .forEach((type: FormFieldType) => {
            it(`${type} should add a classname for required fields`, (done) => {
                const Component = getFormFieldComponent(type);

                const wrapper = mount(
                    <div>
                        <Component
                            formField={{...getTestFieldConfig(type), required: true}}
                            formValues={{}}
                            disabled={false}
                            value={undefined}
                            issues={[]}
                            previewOutput={false}
                            onChange={noop}
                        />
                    </div>,
                );

                setTimeout(() => { // wait for data fetching (only used by some input types)
                    wrapper.update();
                    expect(wrapper.find('.sd-line-input--required').length).toBe(1);

                    done();
                }, 100);
            });
        });
});
