import React from 'react';
import {shallow} from 'enzyme';
import {Editor3Component} from '../Editor3';

describe('<Editor3Component />', () => {
    it('check if toolbar is not showed', () => {
        const wrapper = shallow(<Editor3Component showToolbar={ false } onChange={(x) => x} />);

        expect(wrapper.find('DraftEditor').length).toBe(1);
        expect(wrapper.find('Toolbar').length).toBe(0);
    });
});
