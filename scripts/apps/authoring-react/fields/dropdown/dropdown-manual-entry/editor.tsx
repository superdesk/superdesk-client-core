import * as React from 'react';
import {IVocabulary, IVocabularyItem} from 'superdesk-api';
import {IDropdownConfigManualSource, IDropdownValue} from '..';
import {EditorUsingManualSourceOrVocabulary} from '../editor-using-manual-source-or-vocabulary';

interface IProps {
    config: IDropdownConfigManualSource;
    value: IDropdownValue;
    language: string;
    getVocabularyItems(vocabulary: IVocabulary['_id']): Array<IVocabularyItem>;
    onChange(value: IDropdownValue): void;
}

export class EditorManualEntry extends React.PureComponent<IProps> {
    render() {
        return (
            <EditorUsingManualSourceOrVocabulary {...this.props} />
        );
    }
}
