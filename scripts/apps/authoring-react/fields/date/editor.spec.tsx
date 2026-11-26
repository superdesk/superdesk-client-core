import React from 'react';
import {mount} from 'enzyme';
import {DatePicker} from 'superdesk-ui-framework/react';
import {IArticle, IDateValueOperational} from 'superdesk-api';
import {Editor} from './editor';

function Container(props: {children?: React.ReactNode}) {
    return <div>{props.children}</div>;
}

function render(value: IDateValueOperational | null, onChange: (value: IDateValueOperational) => void = () => null) {
    return mount(
        <Editor
            editorId="custom-date"
            container={Container}
            value={value}
            onChange={onChange}
            reinitialize={() => undefined}
            computeLatestEntity={() => undefined}
            readOnly={false}
            language="en"
            config={{}}
            fieldId="custom-date"
            fieldsData={null}
            editorPreferences={undefined as never}
            onEditorPreferencesChange={() => undefined}
            getVocabularyItems={() => []}
            item={{_id: 'date-editor-spec', type: 'text'} as IArticle}
        />,
    );
}

function inputValue(wrapper: ReturnType<typeof render>): string {
    return wrapper.find('input').getDOMNode<HTMLInputElement>().value;
}

describe('date field editor', () => {
    it('shows an empty input when the field has no value', () => {
        const wrapper = render(null);

        expect(inputValue(wrapper)).toBe('');

        wrapper.unmount();
    });

    it('shows a stored date', () => {
        const wrapper = render('2030-12-24T12:00:00+0000');

        expect(inputValue(wrapper)).toContain('2030');

        wrapper.unmount();
    });

    it('stores a picked day as UTC midnight and a cleared field as an empty string', () => {
        const onChange = jasmine.createSpy('onChange');
        const wrapper = render(null, onChange);
        const picker = wrapper.find(DatePicker).last();

        picker.prop('onChange')(new Date(2030, 11, 24, 15, 30));
        expect(onChange).toHaveBeenCalledWith('2030-12-24T00:00:00+0000');

        picker.prop('onChange')(null);
        expect(onChange).toHaveBeenCalledWith('');

        wrapper.unmount();
    });
});
