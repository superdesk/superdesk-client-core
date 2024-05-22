import React from 'react';
import {ContentBlock, ContentState} from 'draft-js';
import {TableBlock} from './tables/TableBlock';
import {IEditorStore} from 'core/editor3/store';
import {DraggableEditor3BlockWithInlineHandle} from './media/dragable-editor3-block-with-labels';
import {DragHandleDots} from 'superdesk-ui-framework/react';

export const MULTI_LINE_QUOTE_CLASS = 'multi-line-quote';

interface IProps {
    block: ContentBlock;
    contentState: ContentState;
    spellchecking: IEditorStore['spellchecking'];
}

export class CustomBlock extends React.Component<IProps> {
    render() {
        const {block, contentState} = this.props;
        const entityKey = block.getEntityAt(0);
        const label = contentState.getEntity(entityKey).getData()?.data?.label ?? null;

        return (
            <DraggableEditor3BlockWithInlineHandle
                block={block}
                customDragHandle={() => {
                    return (
                        <span className="editor3-custom-block--label-wrapper" style={{display: 'flex'}}>
                            <span className="editor3-custom-block--drag-handle">
                                <div>
                                    <DragHandleDots />
                                </div>

                                <span className="editor3-custom-block--label">{label}</span>
                            </span>
                        </span>
                    );
                }}
            >
                <div className="editor3-custom-block">
                    <TableBlock
                        fullWidth
                        tableKind="custom-block"
                        block={this.props.block}
                        spellchecking={this.props.spellchecking}
                    />
                </div>
            </DraggableEditor3BlockWithInlineHandle>
        );
    }
}
