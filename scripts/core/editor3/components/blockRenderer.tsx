import React from 'react';
import {MediaBlock} from './media/MediaBlock';
import {EmbedBlock} from './embeds';
import {TableBlock} from './tables/TableBlock';
import {ContentBlock, ContentState} from 'draft-js';
import {DraggableEditor3Block} from './media/dragable-editor3-block';
import {MultiLineQuote} from './multi-line-quote';
import {CustomEditor3Entity} from '../constants';
import {ArticleEmbed} from './article-embed/article-embed';
import {IEditorStore} from '../store';
import {CustomBlock} from './custom-block';

interface IProps {
    contentState: ContentState;
    block: ContentBlock;
    blockProps: {
        spellchecking: IEditorStore['spellchecking'];
    };
}

const BlockRendererComponent: React.FunctionComponent<IProps> = (props) => {
    const {block, contentState} = props;
    const entityKey = block.getEntityAt(0);
    const spellchecking: IEditorStore['spellchecking'] | undefined | null = props.blockProps.spellchecking;

    if (!entityKey) {
        return null;
    }

    const type = contentState.getEntity(entityKey).getType();

    const disabledSpellcheckerConfig: IEditorStore['spellchecking'] = {
        enabled: false,
        language: 'en',
        inProgress: false,
        warningsByBlock: {},
    };

    function getComponent() {
        if (type === CustomEditor3Entity.MEDIA) {
            return (
                <DraggableEditor3Block block={props.block}>
                    <MediaBlock contentState={props.contentState} block={props.block} />
                </DraggableEditor3Block>
            );
        } else if (type === CustomEditor3Entity.EMBED) {
            return (
                <DraggableEditor3Block block={props.block}>
                    <EmbedBlock contentState={props.contentState} block={props.block} />
                </DraggableEditor3Block>
            );
        } else if (type === CustomEditor3Entity.TABLE) {
            // Spellchecker is disabled for tables to avoid performance issues.
            // As it is currently implemented, it would send one spellchecking request for each table cell.
            return (
                <DraggableEditor3Block block={props.block}>
                    <TableBlock
                        block={props.block}
                        spellchecking={disabledSpellcheckerConfig}
                        tableKind="table"
                    />
                </DraggableEditor3Block>
            );
        } else if (type === CustomEditor3Entity.MULTI_LINE_QUOTE) {
            return (
                <DraggableEditor3Block block={props.block}>
                    <MultiLineQuote block={props.block} spellchecking={spellchecking} />
                </DraggableEditor3Block>
            );
        } else if (type === CustomEditor3Entity.ARTICLE_EMBED) {
            return (
                <DraggableEditor3Block block={props.block}>
                    <ArticleEmbed contentState={props.contentState} block={props.block} />
                </DraggableEditor3Block>
            );
        } else if (type === CustomEditor3Entity.CUSTOM_BLOCK) {
            return (
                // uses draggable wrapper inside the component
                <CustomBlock contentState={props.contentState} block={props.block} spellchecking={spellchecking} />
            );
        } else {
            return null;
        }
    }

    return getComponent();
};

export function getBlockRenderer(spellchecking: IEditorStore['spellchecking']) {
    return (contentBlock: ContentBlock) => {
        return contentBlock.getType() !== 'atomic' ? null : {
            component: BlockRendererComponent,
            editable: false,
            props: {
                spellchecking,
            },
        };
    };
}
