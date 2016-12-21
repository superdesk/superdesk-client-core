import React from 'react';
import {mount} from 'enzyme';
import {MarkDesksDropdown} from 'apps/desks/components';
import {MarkedDeskItem} from 'apps/desks/components';


describe('<MarkDesksDropdown />', () => {
    var desk1 = {_id: 1, name: 'desk1'};
    var desk2 = {_id: 2, name: 'desk2'};
    var allDesks = {desks: {_items: [desk1, desk2]}};
    var item = {};

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
