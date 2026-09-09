import React from 'react';
import {shallow} from 'enzyme';
import {appConfig} from 'appConfig';
import {TextStatistics} from './text-statistics';

describe('TextStatistics', () => {
    let previousAuthoringConfig: typeof appConfig.authoring;

    beforeEach(() => {
        previousAuthoringConfig = appConfig.authoring;
    });

    afterEach(() => {
        appConfig.authoring = previousAuthoringConfig;
    });

    it('shows reading time by default', () => {
        const wrapper = shallow(<TextStatistics text="one two three" />);

        expect(wrapper.text()).toContain('less than one minute read');
    });

    it('hides reading time when disabled via app config', () => {
        appConfig.authoring = {
            timeToRead: false,
        };

        const wrapper = shallow(<TextStatistics text="one two three" />);

        expect(wrapper.text()).not.toContain('less than one minute read');
    });
});
