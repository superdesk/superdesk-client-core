import React from 'react';
import {mount} from 'enzyme';
import {MarkDesksDropdown} from 'apps/desks/components';
import {MarkedDeskItem} from 'apps/desks/components';

describe('<MarkDesksDropdown />', () => {
    const desk1 = {_id: 1, name: 'desk1'};
    const desk2 = {_id: 2, name: 'desk2'};
    const allDesks = {desks: {_items: [desk1, desk2]}};
    const item = {};

    it('check default values for dropdown', () => {
        const wrapper = mount(<MarkDesksDropdown desks={allDesks}
            className="abc" item={item} noDesksLabel="No desk"/>);

        expect(wrapper.find('MarkedDeskItem').length).toBe(2);
        expect(wrapper.find('MarkBtn').length).toBe(2);
    });

    it('check default values for dropdowns', () => {
        const wrapper = mount(<MarkedDeskItem desks={allDesks} desk={desk1} item={item}/>);

        expect(wrapper.find('MarkBtn').length).toBe(1);
    });
});
