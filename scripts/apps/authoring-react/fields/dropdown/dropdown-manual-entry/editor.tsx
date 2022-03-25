import * as React from 'react';
import {IDropdownConfigManualSource, IDropdownValue} from '..';
import {EditorUsingManualSourceOrVocabulary} from '../editor-using-manual-source-or-vocabulary';

interface IProps {
    config: IDropdownConfigManualSource;
    value: IDropdownValue;
    language: string;
    onChange(value: IDropdownValue): void;
}

export class EditorManualEntry extends React.PureComponent<IProps> {
    render() {
        return (
            <EditorUsingManualSourceOrVocabulary {...this.props} />
        );
    }
}
