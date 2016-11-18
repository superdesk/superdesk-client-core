
import React from 'react'
import { shallow, mount } from 'enzyme'
import { Editor3 } from '../Editor3'
import {stateToHTML} from 'draft-js-export-html';


describe('<Editor3 />', () => {
    it('check default values for editor', () => {
        const wrapper = mount(<Editor3 onChange={(x) => x} />)
        expect(wrapper.find('DraftEditor').length).toBe(1)
        expect(wrapper.find('BlockStyleControls').length).toBe(1)
        expect(wrapper.find('InlineStyleControls').length).toBe(1)
    })

    it('check if toolbar is not showed', () => {
        const wrapper = mount(<Editor3 showToolbar={ false } onChange={(x) => x} />)
        expect(wrapper.find('DraftEditor').length).toBe(1)
        expect(wrapper.find('BlockStyleControls').length).toBe(0)
        expect(wrapper.find('InlineStyleControls').length).toBe(0)
    })

    it('check initial value for text', () => {
        const wrapper = mount(<Editor3 onChange={(x) => x} value={ '<h1>test value</h1>' }/>)
        const currentContent = wrapper.state().editorState.getCurrentContent();
        expect(stateToHTML(currentContent)).toBe('<h1>test value</h1>')
    })
})
