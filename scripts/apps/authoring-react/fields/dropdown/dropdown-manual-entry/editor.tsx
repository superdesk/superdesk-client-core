import * as React from 'react';
import {
    IEditorComponentContainerProps,
    IVocabulary,
    IVocabularyItem,
    IDropdownConfigManualSource,
    IDropdownValue,
} from 'superdesk-api';
import {EditorUsingManualSourceOrVocabulary} from '../editor-using-manual-source-or-vocabulary';

interface IProps {
    container: React.ComponentType<IEditorComponentContainerProps>;
    config: IDropdownConfigManualSource;
    value: IDropdownValue;
    language: string;
    readOnly: boolean;
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
