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

/**
 * Priority and urgency are codes with names. authoring-angular puts the code in the badge and
 * writes the name beside it (`sd-meta-dropdown` with `data-icon`), and the e2e vocabulary hides
 * the difference because every item there is named after its own qcode. A vocabulary that names
 * qcode 1 "Urgent" is the case that matters.
 */
describe('DropdownItemTemplate', () => {
    it('keeps the name readable next to the badge when the option has a code', () => {
        const wrapper = render({id: 1, label: 'Urgent', badgeLabel: '1', color: '#b82f00'});

        expect(wrapper.text()).toContain('Urgent');

        const badge = wrapper.find('span').at(0);

        expect(badge.text()).toBe('1');
        expect(badge.prop('style').backgroundColor).toBe('#b82f00');
    });

    it('does not put the name inside the badge', () => {
        const wrapper = render({id: 1, label: 'Urgent', badgeLabel: '1', color: '#b82f00'});

        expect(wrapper.find('span').at(0).text()).not.toContain('Urgent');
    });

    it('leaves an option with no code rendering its label in the badge', () => {
        const wrapper = render({id: 'sports', label: 'Sports'});

        expect(wrapper.find('span').length).toBe(1);
        expect(wrapper.text()).toBe('Sports');
    });

    /**
     * The regression the fixture cannot show: with name === qcode both implementations read "6 6",
     * so a template that drops the badge or the name still looks right there.
     */
    it('writes the code and the name separately even when they are the same', () => {
        const wrapper = render({id: 6, label: '6', badgeLabel: '6', color: '#c0c9a1'});

        expect(wrapper.find('span').at(0).text()).toBe('6');
        expect(wrapper.find('span').at(1).text()).toBe('6');
    });
});
