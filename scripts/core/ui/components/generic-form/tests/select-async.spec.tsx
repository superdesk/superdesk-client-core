import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
import {GenericFormFieldType} from '../interfaces/form';
import {getFormFieldComponent} from '../form-field';
import {ISelectAsyncParameters} from '../input-types/select_async';

function getComponent() {
    return getFormFieldComponent(GenericFormFieldType.selectAsync);
}

function getField(componentParameters: ISelectAsyncParameters) {
    return {
        type: GenericFormFieldType.selectAsync,
        field: 'default_model',
        component_parameters: componentParameters,
    };
}

function mountField(componentParameters: ISelectAsyncParameters, value: string, onChange = noop) {
    const Component = getComponent();

    return mount(
        <div>
            <Component
                formField={getField(componentParameters)}
                formValues={{}}
                disabled={false}
                value={value}
                issues={[]}
                previewOutput={false}
                onChange={onChange}
            />
        </div>,
    );
}

describe('selectAsync form field', () => {
    it('offers the options returned by getOptions', (done) => {
        const wrapper = mountField(
            {getOptions: () => Promise.resolve([{id: 'model-a', label: 'Model A'}])},
            undefined,
        );

        setTimeout(() => {
            wrapper.update();

            const optionValues = wrapper.find('option').map((option) => option.prop('value'));

            expect(optionValues).toEqual(['', 'model-a']);
            expect(wrapper.html()).toContain('Model A');

            done();
        });
    });

    it('keeps the current value and does not change it when getOptions rejects', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = mountField(
            {getOptions: () => Promise.reject(new Error('provider unreachable'))},
            'stored-model',
            onChange,
        );

        setTimeout(() => {
            wrapper.update();

            expect(wrapper.find('select').length).toBe(0);
            expect(wrapper.find('input').prop('value')).toBe('stored-model');
            expect(wrapper.find('[data-test-id="gform-message--default_model"]').length).toBe(1);
            expect(onChange).not.toHaveBeenCalled();

            done();
        });
    });

    it('lets the value be typed by hand when getOptions rejects', (done) => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = mountField(
            {getOptions: () => Promise.reject(new Error('provider unreachable'))},
            'stored-model',
            onChange,
        );

        setTimeout(() => {
            wrapper.update();

            wrapper.find('input').simulate('change', {target: {value: 'typed-model'}});

            expect(onChange).toHaveBeenCalledWith('typed-model');

            done();
        });
    });

    it('lists a stored value the options do not offer', (done) => {
        const wrapper = mountField(
            {getOptions: () => Promise.resolve([{id: 'model-a', label: 'Model A'}])},
            'retired-model',
        );

        setTimeout(() => {
            wrapper.update();

            expect(wrapper.find('option').map((option) => option.prop('value')))
                .toEqual(['', 'model-a', 'retired-model']);

            done();
        });
    });
});
