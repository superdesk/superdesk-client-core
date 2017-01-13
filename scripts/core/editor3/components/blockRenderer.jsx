import React from 'react';
import ImageBlock from './toolbar/images/ImageBlock';
import {Entity} from 'draft-js';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name MediaComponent
 * @param {Object} block The block being rendered.
 * @description Media block renderer component.
 */
const MediaComponent = (props) => {
    const entityKey = props.block.getEntityAt(0);
    const type = Entity.get(entityKey).getType();

    switch (type) {
    case 'IMAGE':
        return <ImageBlock {...props} />;
    default:
        return null;
    }
};

MediaComponent.propTypes = {
    block: React.PropTypes.object.isRequired
};

export function blockRenderer(block) {
    return block.getType() !== 'atomic' ? null : {
        component: MediaComponent,
        editable: false
    };
}
