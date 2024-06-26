import React from 'react';
import {shallow, mount} from 'enzyme';
import {MediaBlockComponent as MediaBlock} from '../media/MediaBlock';
import {imageBlockAndContent} from './utils';
import {PlainTextEditor} from 'core/ui/components';
import {noop} from 'lodash';

describe('editor3.components.media-block', () => {
    it('should render', () => {
        const {block, contentState} = imageBlockAndContent();
        const wrapper = shallow(
            <MediaBlock
                cropImage={() => ({})}
                changeCaption={() => ({})}
                setLocked={() => ({})}
                block={block}
                contentState={contentState}
                readOnly={false}
                showTitle={false}
                removeBlock={noop}
            />,
        );

        expect(wrapper.find('img').props().src).toBe('image_href');
        expect(wrapper.find('img').props().alt).toBe('image_alt_text');
        expect(wrapper.find(PlainTextEditor).prop('value')).toBe('image_description');
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
                contentState={contentState}
                readOnly={false}
                showTitle={false}
                removeBlock={noop}
            />,
        );

        wrapper.find('.image-block__image-action').first()
            .simulate('click');

        const entityKey = block.getEntityAt(0);
        const entity = contentState.getEntity(entityKey);

        expect(cropImage).toHaveBeenCalledWith(entityKey, entity.getData(),
            {isNew: false, showMetadata: true, defaultTab: 'view'});
    });
});
