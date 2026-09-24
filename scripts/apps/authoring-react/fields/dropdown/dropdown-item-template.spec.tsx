import React from 'react';
import {mount} from 'enzyme';
import {IDropdownConfigManualSource, IDropdownOption} from 'superdesk-api';
import {DropdownItemTemplate} from './dropdown-item-template';

const config: IDropdownConfigManualSource = {
    source: 'manual-entry',
    type: 'number',
    options: [],
    roundCorners: false,
    multiple: false,
};

function render(option: IDropdownOption) {
    return mount(<DropdownItemTemplate option={option} config={config} noPadding={false} />);
}

// Priority and urgency are codes with names, and angular puts the code in the badge with the name
// beside it. The e2e vocabulary names each item after its own qcode, which hides the difference;
// the case that matters is one that names qcode 1 "Urgent".
describe('DropdownItemTemplate', () => {
    it('keeps the name readable next to the badge when the option has a code', () => {
        const wrapper = render({id: 1, label: 'Urgent', badgeLabel: '1', color: '#b82f00'});

        expect(wrapper.text()).toContain('Urgent');

        const badge = wrapper.find('span').at(0);

        expect(badge.text()).toBe('1');
        expect(badge.prop('style').backgroundColor).toBe('#b82f00');
    });

    it('leaves an option with no code rendering its label in the badge', () => {
        const wrapper = render({id: 'sports', label: 'Sports'});

        expect(wrapper.find('span').length).toBe(1);
        expect(wrapper.text()).toBe('Sports');
    });

    // With name === qcode both implementations read "6 6", so the e2e fixture cannot catch this.
    it('writes the code and the name separately even when they are the same', () => {
        const wrapper = render({id: 6, label: '6', badgeLabel: '6', color: '#c0c9a1'});

        expect(wrapper.find('span').at(0).text()).toBe('6');
        expect(wrapper.find('span').at(1).text()).toBe('6');
    });
});
