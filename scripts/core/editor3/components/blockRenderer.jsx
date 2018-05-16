import React from 'react';
import PropTypes from 'prop-types';
import {MediaBlock} from './media';
import {EmbedBlock} from './embeds';
import {TableBlock} from './tables';
import {loadMediaById} from '../actions/editor3';

function loadMissingMediaAsync(entityKey, html, dispatch) {
    const node = $('<div />');

    node.html(html);

    let media = node.find('img');

    if (!media) {
        media = node.find('video');
    }

    if (!media) {
        media = node.find('audio');
    }

    const editor3universalMediaSrc = media.attr('src');
    const editor2videoSrc = node.find('video source').attr('src');

    const href = editor3universalMediaSrc || editor2videoSrc;

    const editor3description = node.find('.media-block__description').text();
    const editor2description = node.find('figcaption').text();

    dispatch(loadMediaById(entityKey, href, {
        alt_text: media.attr('alt'),
        description_text: editor3description || editor2description,
    }));
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name MediaComponent
 * @param {Object} block The block being rendered.
 * @description Media block renderer component.
 */
const MediaComponent = (props) => {
    const {block, contentState} = props;
    const entityKey = block.getEntityAt(0);

    if (!entityKey) {
        return null;
    }

    const entity = contentState.getEntity(entityKey);
    const entityData = entity.getData();
    const type = entity.getType();

    switch (type) {
    case 'MEDIA':
        if (entityData.media == null) {
            // required for editor2 > editor3 conversion since editor2 doesn't have the media object data
            loadMissingMediaAsync(
                entityKey,
                entityData.html,
                props.blockProps.dispatch
            );
            return <div className="inline-loading-spinner" />;
        }
        return <MediaBlock {...props} />;
    case 'EMBED':
        return <EmbedBlock {...props} />;
    case 'TABLE':
        return <TableBlock {...props} />;
    default:
        return null;
    }
};

MediaComponent.propTypes = {
    block: PropTypes.object.isRequired,
    contentState: PropTypes.object.isRequired,
    blockProps: PropTypes.shape({
        dispatch: PropTypes.func.isRequired,
    }),
};

export function getBlockRenderer(props) {
    return function blockRenderer(block) {
        return block.getType() !== 'atomic' ? null : {
            component: MediaComponent,
            editable: false,
            props: props,
        };
    };
}
