import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
import {GenericFormFieldType} from '../interfaces/form';
import {getFormFieldComponent} from '../form-field';

interface IOptions {
    componentParameters?: {[key: string]: any};
    previewOutput?: boolean;
    issues?: Array<string>;
}

function mountField(options: IOptions = {}) {
    const Component = getFormFieldComponent(GenericFormFieldType.plainText);

    return mount(
        <div>
            <Component
                formField={{
                    type: GenericFormFieldType.plainText,
                    field: 'api_key',
                    component_parameters: options.componentParameters,
                }}
                formValues={{}}
                disabled={false}
                value="secret"
                issues={options.issues ?? []}
                previewOutput={options.previewOutput === true}
                onChange={noop}
            />
        </div>,
    );
}

describe('plainText form field', () => {
    it('masks the input when the password parameter is set', () => {
        expect(mountField({componentParameters: {password: true}}).find('input').prop('type')).toBe('password');
    });

    it('shows the value when the password parameter is absent', () => {
        expect(mountField().find('input').prop('type')).toBe('text');
    });

    it('sets autocomplete on the password input so browsers do not autofill a stored password', () => {
        const input = mountField({componentParameters: {password: true}}).find('input').getDOMNode();

        expect(input.getAttribute('autocomplete')).toBe('new-password');
    });

    it('renders the info parameter as a hint below the input', () => {
        const wrapper = mountField({componentParameters: {info: 'base url only'}});

        expect(wrapper.find('.sd-input__hint').text()).toBe('base url only');
    });

    it('renders the info parameter as a hint below a multiline input', () => {
        const wrapper = mountField({componentParameters: {multiline: true, info: 'base url only'}});

        expect(wrapper.find('.sd-input__hint').text()).toBe('base url only');
    });

    it('shows no hint when the info parameter is absent', () => {
        expect(mountField().find('.sd-input__hint').length).toBe(0);
    });

    it('does not print the value when previewing a password field', () => {
        const wrapper = mountField({componentParameters: {password: true}, previewOutput: true});

        expect(wrapper.html()).not.toContain('secret');
    });

    it('prints the value when previewing a field that is not a password', () => {
        const wrapper = mountField({previewOutput: true});

        expect(wrapper.text()).toBe('secret');
    });
});
