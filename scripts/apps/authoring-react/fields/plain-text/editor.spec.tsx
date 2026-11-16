import React from 'react';
import {mount} from 'enzyme';
import {IEditorComponentContainerProps, IPlainTextFieldConfig} from 'superdesk-api';
import {Editor} from './editor';

class Container extends React.PureComponent<IEditorComponentContainerProps> {
    render() {
        return (
            <div>
                {this.props.labelActions}
                {this.props.children}
            </div>
        );
    }
}

function renderEditor(config: IPlainTextFieldConfig) {
    const props = {
        editorId: 'sign_off',
        fieldId: 'sign_off',
        container: Container,
        value: 'ADM',
        onChange: () => undefined,
        readOnly: false,
        config,
    } as Partial<React.ComponentProps<typeof Editor>> as React.ComponentProps<typeof Editor>;

    return mount(<Editor {...props} />);
}

describe('authoring-react plain-text field editor', () => {
    it('shows a padlock on a lockable field', () => {
        const wrapper = renderEditor({lockable: true});

        expect(wrapper.find('[data-test-id="plain-text-lock"]').exists()).toBe(true);
        expect(wrapper.find('[data-test-id="plain-text-value"]').text()).toBe('ADM');
    });

    it('shows no padlock and no input when the content profile marks the field read-only', () => {
        const wrapper = renderEditor({lockable: true, readOnly: true});

        expect(wrapper.find('[data-test-id="plain-text-lock"]').exists()).toBe(false);
        expect(wrapper.find('[data-test-id="plain-text-input"]').exists()).toBe(false);
        expect(wrapper.find('[data-test-id="plain-text-value"]').text()).toBe('ADM');
    });

    it('shows no input on a read-only field that is not lockable', () => {
        const wrapper = renderEditor({readOnly: true});

        expect(wrapper.find('[data-test-id="plain-text-input"]').exists()).toBe(false);
    });
});
