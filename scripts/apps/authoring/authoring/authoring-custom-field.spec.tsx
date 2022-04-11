import React from 'react';
import {mount} from 'enzyme';
import {AuthoringCustomField} from './authoring-custom-field';
import {ICustomFieldType, IEditorComponentProps, IArticle, IVocabulary} from 'superdesk-api';
import {registerInternalExtension, unregisterInternalExtension} from 'core/helpers/register-internal-extension';
import {testArticle} from 'test-data/test-article';
import {testVocabulary} from 'test-data/test-vocabulary';
import ng from 'core/services/ng';

const vocabularyId = 'vocabulary_id';

const article: IArticle = {
    ...testArticle,
    extra: {
        ...testArticle.extra,
        [vocabularyId]: 'initial_value',
    },
};

const vocabulary: IVocabulary = {
    ...testVocabulary,
    _id: vocabularyId,
    custom_field_type: 'test-custom-authoring-field',
};

class TestEditorComponent extends React.PureComponent<IEditorComponentProps<string, never, never>> {
    render() {
        return (
            <div>
                <input
                    type="text"
                    value={this.props.value}
                    onChange={(event) => {
                        this.props.onChange(event.target.value);
                    }}
                />
            </div>
        );
    }
}

const customField: ICustomFieldType<string, string, string, never> = {
    id: 'test-custom-authoring-field',
    label: 'Test Field',
    editorComponent: TestEditorComponent,
    previewComponent: () => null,
};

describe('custom authoring field', () => {
    beforeEach(inject(($injector) => {
        ng.register($injector);

        registerInternalExtension('test-authoring-custom-field', {
            contributions: {
                customFieldTypes: [customField],
            },
        });
    }));

    afterEach(() => {
        unregisterInternalExtension('test-authoring-custom-field');
    });

    it('updates a field value synchronously', (done) => {
        /*
            `onChange` function passed to `AuthoringCustomField` is debounced
            and the value gets updated asynchronously.

            It can cause internal focus issues with inputs like here: https://jsfiddle.net/kcLd4y57/
            (typing time manually doesn't work)

            To avoid this, the internal state was added to `AuthoringCustomField`. Values are passed to custom fields
            directly from the internal state, and after the asynchronous `onChange` function has executed,
            the internal state is patched with the latest data.
        */

        const onChange = jasmine.createSpy();

        const wrapper = mount(
            <AuthoringCustomField
                item={article}
                field={vocabulary}
                editable={true}
                onChange={onChange}
            />,
        );

        expect(onChange).toHaveBeenCalledTimes(0);
        expect(wrapper.find('input').props().value).toBe('initial_value');

        wrapper.find('input').simulate('change', {target: {value: 'abcd'}});

        // Because of internal state, the correct value is displayed even when `onChange` hasn't been called yet
        expect(onChange).toHaveBeenCalledTimes(0);
        expect(wrapper.find('input').props().value).toBe('abcd');

        setTimeout(() => {
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(
                vocabulary,
                'abcd',
            );

            done();
        }, 500); // take debouncing into account
    });

    it('internal state gets patched when props change', () => {
        const onChange = jasmine.createSpy();

        const wrapper = mount(
            <AuthoringCustomField
                item={article}
                field={vocabulary}
                editable={true}
                onChange={onChange}
            />,
        );

        expect(onChange).toHaveBeenCalledTimes(0);
        expect(wrapper.find('input').props().value).toBe('initial_value');

        wrapper.setProps({
            item: {
                ...article,
                extra: {
                    ...article.extra,
                    [vocabularyId]: 'updated_value',
                },
            },
        });

        expect(onChange).toHaveBeenCalledTimes(0);
        expect(wrapper.update().find('input').props().value).toBe('updated_value');
    });
});
