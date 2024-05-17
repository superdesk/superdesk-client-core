import React from 'react';
import {ContentBlock, ContentState} from 'draft-js';
import {TableBlock} from './tables/TableBlock';
import {IEditorStore} from 'core/editor3/store';

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
            <div style={{border: '1px solid blue'}}>
                <div>{label}</div>
                <TableBlock
                    fullWidth
                    className={MULTI_LINE_QUOTE_CLASS}
                    tableKind="custom-block"
                    block={this.props.block}
                    spellchecking={this.props.spellchecking}
                />
            </div>
        );
    }
}
