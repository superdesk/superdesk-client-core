import * as React from 'react';
import {mountWithCleanup} from '../tests/helpers';
import {LimitNotification} from './limit-notification';

describe('LimitNotification', () => {
    it('renders the limit warning with the limit interpolated', () => {
        const wrapper = mountWithCleanup(<LimitNotification limit={10} />);

        expect(wrapper.text()).toContain('This list is limited to 10 items. Articles below will be removed.');
    });

    it('uses the singular form for a limit of one', () => {
        const wrapper = mountWithCleanup(<LimitNotification limit={1} />);

        expect(wrapper.text()).toContain('This list is limited to 1 item. Articles below will be removed.');
    });
});
