import React from 'react';
import {ContentBlock, ContentState} from 'draft-js';
import {TableBlock} from './tables/TableBlock';
import {IEditorStore} from 'core/editor3/store';
import {sdApi} from 'api';
import {IVocabularyEditorBlock} from 'superdesk-api';

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
        const vocabularyId = contentState.getEntity(entityKey).getData()?.data?.vocabularyId ?? null;

        const vocabulary: IVocabularyEditorBlock | null = (() => {
            const _vocabulary = vocabularyId == null
                ? null
                : sdApi.vocabularies.getAll().get(vocabularyId);

            if (_vocabulary.field_type === 'editor-block') { // checking for type narrowing
                return _vocabulary;
            } else {
                return null;
            }
        })();
        const label = vocabulary == null ? null : vocabulary.display_name;

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
