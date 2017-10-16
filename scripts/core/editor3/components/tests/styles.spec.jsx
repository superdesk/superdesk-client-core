import React from 'react';
import {shallow, mount} from 'enzyme';
import {EditorState} from 'draft-js';
import StyleButton from '../toolbar/StyleButton';
import {BlockStyleButtonsComponent as BlockStyleButtons} from '../toolbar/BlockStyleButtons';
import {InlineStyleButtonsComponent as InlineStyleButtons} from '../toolbar/InlineStyleButtons';

describe('editor3.components.toolbar', () => {
    it('(StyleButton) should render label', () => {
        const wrapper = shallow(<StyleButton label={'h1'} />);

        expect(wrapper.hasClass('Editor3-styleButton')).toBe(true);
        expect(wrapper.find('i.icon-heading-1').length).toBe(1);
    });

    it('(StyleButton) should become active when prop is set to true', () => {
        const wrapper = shallow(<StyleButton />);

        expect(wrapper.hasClass('Editor3-activeButton')).toBe(false);
        wrapper.setProps({active: true});
        expect(wrapper.hasClass('Editor3-activeButton')).toBe(true);
    });

    it('(StyleButton) should call prop with style', () => {
        const toggleFn = jasmine.createSpy();
        const wrapper = mount(<StyleButton onToggle={toggleFn} style={'my-style'} />);

        wrapper.simulate('mousedown');

        expect(toggleFn).toHaveBeenCalledWith('my-style');
    });

    it('(BlockStyleButtons) should render only given types', () => {
        const opts = ['h1', 'h2', 'ul'];
        const editorState = EditorState.createEmpty();
        const wrapper = mount(
            <BlockStyleButtons
                editorFormat={opts}
                editorState={editorState}
            />
        );

        wrapper.find('StyleButton').forEach((btn) => {
            const key = btn.key();

            expect(opts.indexOf(key) > -1).toBeTruthy();
            expect(['h3', 'h4', 'h5', 'h6', 'quote', 'ol'].indexOf(key)).toEqual(-1);
        });
    });

    it('(InlineStyleButtons) should render only given types', () => {
        const opts = ['BOLD', 'UNDERLINE'];
        const editorState = EditorState.createEmpty();
        const wrapper = mount(
            <InlineStyleButtons
                editorFormat={opts}
                editorState={editorState}
            />
        );

        wrapper.find('StyleButton').forEach((btn) => {
            const key = btn.key();

            expect(opts.indexOf(key) > -1).toBeTruthy();
            expect(key).not.toEqual('ITALIC');
        });
    });
});
