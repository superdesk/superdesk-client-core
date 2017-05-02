import React from 'react';
import {shallow, mount} from 'enzyme';
import {ImageBlockComponent as ImageBlock} from '../images/ImageBlock';
import {imageBlockAndContent} from './utils';

describe('editor3.components.image-block', () => {
    it('should render', () => {
        const {block, contentState} = imageBlockAndContent();
        const wrapper = shallow(
            <ImageBlock
                cropImage={() => ({})}
                changeCaption={() => ({})}
                setReadOnly={() => ({})}
                block={block}
                contentState={contentState} />);

        expect(wrapper.find('img').props().src).toBe('image_href');
        expect(wrapper.find('img').props().alt).toBe('image_alt_text');
        expect(wrapper.find('.image-block__description').props().defaultValue).toBe('image_description');
    });

    it('should trigger cropImage prop when clicked', () => {
        const {block, contentState} = imageBlockAndContent();
        const cropImage = jasmine.createSpy();
        const wrapper = mount(
            <ImageBlock
                cropImage={cropImage}
                changeCaption={() => ({})}
                setReadOnly={() => ({})}
                block={block}
                contentState={contentState} />);

        wrapper.find('img').simulate('click');

        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);

        expect(cropImage).toHaveBeenCalledWith(entityKey, entity.getData());
    });
});
