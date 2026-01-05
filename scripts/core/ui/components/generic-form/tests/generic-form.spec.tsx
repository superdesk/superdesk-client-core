import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
import {getFormFieldComponent} from '../form-field';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IFormField} from 'superdesk-api';
import {GenericFormFieldType} from '../interfaces/form';
import {mockDataApi} from 'core/tests/mockDataApi';

const reworkedComponents = [
    GenericFormFieldType.plainText,
    GenericFormFieldType.textEditor3,
    GenericFormFieldType.number,
    GenericFormFieldType.duration,
    GenericFormFieldType.selectMultiple,
    GenericFormFieldType.deskSingleValue,
    GenericFormFieldType.stageSingleValue,
    GenericFormFieldType.contentFilterSingleValue,
    GenericFormFieldType.vocabularySingleValue,
    GenericFormFieldType.yesNo,
    GenericFormFieldType.select,
    GenericFormFieldType.macroSingleValue,
];

function getAllInputTypes(): Array<GenericFormFieldType> {
    return Object.keys(GenericFormFieldType).map((key) => GenericFormFieldType[key]);
}

function getTestFieldConfig(type: GenericFormFieldType): IFormField<any> {
    switch (type) {
        case GenericFormFieldType.plainText:
        case GenericFormFieldType.textEditor3:
        case GenericFormFieldType.number:
        case GenericFormFieldType.duration:
        case GenericFormFieldType.checkbox:
        case GenericFormFieldType.contentFilterSingleValue:
        case GenericFormFieldType.deskSingleValue:
        case GenericFormFieldType.yesNo:
        case GenericFormFieldType.alert:
        case GenericFormFieldType.readonlyCopyableText:
            return {
                type: type,
                field: 'test-field',
            };
        case GenericFormFieldType.select:
        case GenericFormFieldType.selectMultiple:
            return {
                type: type,
                field: 'test-field',
                component_parameters: {
                    items: [],
                },
            };
        case GenericFormFieldType.vocabularySingleValue:
            return {
                type: type,
                field: 'test-field',
                component_parameters: {
                    vocabulary_id: 'test_vocabulary_id',
                },
            };
        case GenericFormFieldType.stageSingleValue:
        case GenericFormFieldType.macroSingleValue:
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
        // These don't have error messages
        .filter((type) =>
            type !== GenericFormFieldType.checkbox
            && type !== GenericFormFieldType.alert
            && type !== GenericFormFieldType.readonlyCopyableText,
        )
        .forEach((type: GenericFormFieldType) => {
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
                    const classNameSelector = reworkedComponents.includes(type)
                        ? '.sd-input--invalid'
                        : '.sd-line-input--invalid';

                    expect(wrapper.find(classNameSelector).length).toBe(1);
                    expect(wrapper.html()).toContain(message);

                    done();
                });
            }));
        });

    getAllInputTypes()
        // Those can't be required
        .filter((type) =>
            type !== GenericFormFieldType.checkbox
            && type !== GenericFormFieldType.alert
            && type !== GenericFormFieldType.readonlyCopyableText,
        )
        .forEach((type: GenericFormFieldType) => {
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
                        reworkedComponents.includes(type) ? '.sd-input--required' : '.sd-line-input--required';

                    expect(wrapper.find(classNameSelector).length).toBe(1);

                    done();
                });
            }));
        });
});
