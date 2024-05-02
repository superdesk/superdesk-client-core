import React from 'react';
import PropTypes from 'prop-types';
import {MediaBlock} from './media';
import {EmbedBlock} from './embeds';
import {TableBlock} from './tables/TableBlock';
import {ContentBlock} from 'draft-js';
import {DragableEditor3Block} from './media/dragable-editor3-block';
import {MultiLineQuote} from './multi-line-quote';
import {CustomEditor3Entity} from '../constants';
import {ArticleEmbed} from './article-embed/article-embed';

const BlockRendererComponent: React.StatelessComponent<any> = (props) => {
    const {block, contentState} = props;
    const entityKey = block.getEntityAt(0);

    if (!entityKey) {
        return null;
    }

    const type = contentState.getEntity(entityKey).getType();

    function getComponent() {
        if (type === CustomEditor3Entity.MEDIA) {
            return <MediaBlock {...props} />;
        } else if (type === CustomEditor3Entity.EMBED) {
            return <EmbedBlock {...props} />;
        } else if (type === CustomEditor3Entity.TABLE) {
            return <TableBlock {...props} toolbarStyle="table" />;
        } else if (type === CustomEditor3Entity.MULTI_LINE_QUOTE) {
            return <MultiLineQuote {...props} />;
        } else if (type === CustomEditor3Entity.ARTICLE_EMBED) {
            return <ArticleEmbed {...props} />;
        } else {
            return null;
        }
    }

    const component = getComponent();

    if (component == null) {
        return null;
    } else {
        return (
            <DragableEditor3Block block={block}>
                {component}
            </DragableEditor3Block>
        );
    }
};

BlockRendererComponent.propTypes = {
    block: PropTypes.object.isRequired,
    contentState: PropTypes.object.isRequired,
};

export function blockRenderer(contentBlock: ContentBlock) {
    return contentBlock.getType() !== 'atomic' ? null : {
        component: BlockRendererComponent,
        editable: false,
    };
}
