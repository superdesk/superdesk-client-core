import React from 'react';
import {render} from 'enzyme';
import {TextSingleLine} from '../input-types/text-single-line';
import {CheckboxInput} from '../input-types/checkbox';
import {IInputType} from '../interfaces/input-types';
import {IFormField, FormFieldType} from '../interfaces/form';
import {noop} from 'lodash';

const formFieldComponents: Array<React.ComponentType<IInputType<any>>> = [TextSingleLine, CheckboxInput];

const fieldConfig: IFormField = {
    type: FormFieldType.textSingleLine,
    field: 'test-field',
};

fdescribe('Generic Form', () => {
    it('All inputs types should render error messages', () => {
        const message = 'test-error-message';

        formFieldComponents.forEach((Component) => {
            const wrapper = render(
                <Component
                    formField={fieldConfig}
                    formValues={{}}
                    disabled={false}
                    value=""
                    issues={[message]}
                    previewOuput={false}
                    onChange={noop}
                />);

            expect(wrapper.html()).toContain(message);
        });
    });

    it('All inputs types should render test id', () => {
        formFieldComponents.forEach((Component) => {
            const wrapper = render(
                <Component
                    formField={fieldConfig}
                    formValues={{}}
                    disabled={false}
                    value=""
                    issues={['test-issue-1']}
                    previewOuput={false}
                    onChange={noop}
                />);

            expect(wrapper.html()).toContain(`data-test-id="gform-input--${fieldConfig.field}"`);
        });
    });
});
