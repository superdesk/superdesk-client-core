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
    case FormFieldType.plainText:
    case FormFieldType.textEditor3:
    case FormFieldType.number:
    case FormFieldType.duration:
    case FormFieldType.checkbox:
    case FormFieldType.contentFilterSingleValue:
    case FormFieldType.deskSingleValue:
    case FormFieldType.yesNo:
        return {
            type: type,
            field: 'test-field',
        };
    case FormFieldType.select:
    case FormFieldType.selectMultiple:
        return {
            type: type,
            field: 'test-field',
            component_parameters: {
                items: [],
            },
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
    default:
        assertNever(type);
    }
}

describe('generic form', () => {
    const message = 'error-q7w8e9r';

    beforeEach(mockDataApi);
    beforeEach(window.module('superdesk.apps.desks'));

    getAllInputTypes()
        .filter((type) => type !== FormFieldType.checkbox) // checkbox doesn't have error messages
        .forEach((type: FormFieldType) => {
            it(`${type} should render error messages`, (done) => inject((desks) => {
                desks.desks = {_items: []};

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
                    const classNameSelector = '.sd-line-input--invalid';

                    expect(wrapper.find(classNameSelector).length).toBe(1);
                    expect(wrapper.html()).toContain(message);

                    done();
                });
            }));
        });

    const exceptionalClassNamesForRequiredFields = {
        [FormFieldType.duration]: '.sd-input--required',
        [FormFieldType.selectMultiple]: '.sd-input--required',
    };

    getAllInputTypes()
        .filter((type) => type !== FormFieldType.checkbox) // checkbox can't be required
        .forEach((type: FormFieldType) => {
            it(`${type} should add a className for required fields`, (done) => inject((desks) => {
                desks.desks = {_items: []};

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

                    const classNameSelector =
                        exceptionalClassNamesForRequiredFields[type] ?? '.sd-line-input--required';

                    expect(wrapper.find(classNameSelector).length).toBe(1);

                    done();
                });
            }));
        });
});
