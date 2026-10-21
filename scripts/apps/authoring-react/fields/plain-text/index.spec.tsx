import React from 'react';
import {mount} from 'enzyme';
import {getPlainTextField} from './index';
import {Difference} from './difference';

describe('authoring-react plain-text field', () => {
    it('treats a whitespace-only value as empty, so a required field fails validation', () => {
        const {hasValue} = getPlainTextField();

        expect(hasValue('   ')).toBe(false);
        expect(hasValue(null)).toBe(false);
        expect(hasValue('ADM')).toBe(true);
    });

    // the generic difference keys a plain object by these ids and then calls `hasOwnProperty` on it
    it('renders the difference for a value named like an object property', () => {
        const props = {value1: 'hasOwnProperty', value2: 'hasOwnProperty'} as React.ComponentProps<typeof Difference>;

        expect(mount(<Difference {...props} />).text()).toContain('hasOwnProperty');
    });
});
