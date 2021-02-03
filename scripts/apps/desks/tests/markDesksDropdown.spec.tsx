import React from 'react';
import {mount} from 'enzyme';
import {MarkDesksDropdown} from 'apps/desks/components';
import {MarkForDeskButton} from '../components/MarkBtn';
import {IDesk} from 'superdesk-api';
import {testArticle} from 'test-data/test-article';
import {testDesk} from 'test-data/test-desk';

describe('<MarkDesksDropdown />', () => {
    const desk1: IDesk = {...testDesk, _id: '1', name: 'Desk 1'};
    const desk2: IDesk = {...testDesk, _id: '2', name: 'Desk 2'};
    const item = testArticle;

    it('check default values for dropdown', () => {
        const wrapper = mount(
            <MarkDesksDropdown
                desks={[desk1, desk2]}
                item={item}
                className="abc"
                noDesksLabel="No desk"
            />,
        );

        expect(wrapper.find('[data-test-id="mark-for-desk--desk"]').length).toBe(2);
    });

    it('check default values for dropdowns', () => {
        const wrapper = mount(<MarkForDeskButton desk={desk1} item={item} />);

        expect(wrapper.find('[data-test-id="mark-for-desk--desk"]').length).toBe(1);
    });
});
