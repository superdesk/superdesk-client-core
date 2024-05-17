import React from 'react';
import {ContentBlock} from 'draft-js';
import {TableBlock} from '../tables/TableBlock';
import {IEditorStore} from 'core/editor3/store';

export const MULTI_LINE_QUOTE_CLASS = 'multi-line-quote';

interface IProps {
    block: ContentBlock;
    spellchecking: IEditorStore['spellchecking'];
}

/**
 * Supports quotes that may contain multiple blocks including headings.
 */
export class MultiLineQuote extends React.Component<IProps> {
    render() {
        return (
            <TableBlock
                fullWidth
                className={MULTI_LINE_QUOTE_CLASS}
                tableKind="multi-line-quote"
                block={this.props.block}
                spellchecking={this.props.spellchecking}
            />
        );
    }
}
