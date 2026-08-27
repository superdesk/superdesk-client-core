import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';
import {GenericFormFieldType} from '../interfaces/form';
import {getSelectSingleValue} from '../input-types/select_single_value';

const UNAVAILABLE_MESSAGE = 'Select a desk first';

function countOccurrences(haystack: string, needle: string): number {
    return haystack.split(needle).length - 1;
}

function mountField(editableWhenItemsUnavailable?: boolean) {
    const Component = getSelectSingleValue(
        () => Promise.resolve(null),
        UNAVAILABLE_MESSAGE,
        undefined,
        editableWhenItemsUnavailable,
    );

    return mount(
        <Component
            formField={{
                type: GenericFormFieldType.macroSingleValue,
                field: 'macro',
            }}
            formValues={{}}
            disabled={false}
            value={undefined}
            issues={[]}
            previewOutput={false}
            onChange={noop}
        />,
    );
}

describe('selectSingleValue form field', () => {
    it('shows the unavailable message once when the select is kept', (done) => {
        const wrapper = mountField();

        setTimeout(() => {
            wrapper.update();

            expect(wrapper.find('select').length).toBe(1);
            expect(countOccurrences(wrapper.html(), UNAVAILABLE_MESSAGE)).toBe(1);

            done();
        });
    });

    it('shows the unavailable message once when falling back to a text input', (done) => {
        const wrapper = mountField(true);

        setTimeout(() => {
            wrapper.update();

            expect(wrapper.find('input').length).toBe(1);
            expect(countOccurrences(wrapper.html(), UNAVAILABLE_MESSAGE)).toBe(1);

            done();
        });
    });
});
