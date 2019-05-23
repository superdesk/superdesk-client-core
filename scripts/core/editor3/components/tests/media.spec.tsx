import React from 'react';
import {shallow, mount} from 'enzyme';
import {MediaBlockComponent as MediaBlock} from '../media/MediaBlock';
import {imageBlockAndContent} from './utils';
import Textarea from 'react-textarea-autosize';

const servicesStub = {
    svc: {},
};

describe('editor3.components.media-block', () => {
    it('should render', () => {
        const {block, contentState} = imageBlockAndContent();
        const wrapper = shallow(
            <MediaBlock
                cropImage={() => ({})}
                changeCaption={() => ({})}
                setLocked={() => ({})}
                block={block}
                blockProps={servicesStub}
                contentState={contentState} />);

        expect(wrapper.find('img').props().src).toBe('image_href');
        expect(wrapper.find('img').props().alt).toBe('image_alt_text');
        expect(wrapper.find(Textarea).prop('value')).toBe('image_description');
    });

    it('should trigger cropImage prop when clicked', () => {
        const {block, contentState} = imageBlockAndContent();
        const cropImage = jasmine.createSpy();
        const wrapper = mount(
            <MediaBlock
                cropImage={cropImage}
                changeCaption={() => ({})}
                setLocked={() => ({})}
                block={block}
                blockProps={servicesStub}
                contentState={contentState} />);

        wrapper.find('.image-block__image-action').first()
            .simulate('click');

        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);

        expect(cropImage).toHaveBeenCalledWith(entityKey, entity.getData(),
            {isNew: false, showMetadata: true, defaultTab: 'view'});
    });
});
