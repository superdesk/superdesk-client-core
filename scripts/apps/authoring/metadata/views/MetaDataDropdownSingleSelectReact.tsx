import React from 'react';
import {Select, Option} from 'superdesk-ui-framework/react';
import {IVocabularyItem} from 'superdesk-api';
import {getVocabularyItemNameTranslated} from 'core/utils';

interface IProps {
    selectedItemLabel: string;
    options: Array<IVocabularyItem>;
    onChange(item: IVocabularyItem): void;
    tabIndex: number;
    disabled: boolean;
    language: string;
}

export class MetaDataDropdownSingleSelectReact extends React.PureComponent<IProps> {
    render() {
        const {selectedItemLabel, options, language, tabIndex, disabled} = this.props;

        const optionsWithTranslations = options.map((option) =>
            ({label: getVocabularyItemNameTranslated(option, language), value: option.qcode, option}));

        const selectedValue = optionsWithTranslations.find(
            (option) => option.label === selectedItemLabel,
        )?.option.qcode ?? '';

        return (
            <Select
                value={selectedValue}
                onChange={(_qcode) => {
                    this.props.onChange(options.find(({qcode}) => qcode === _qcode));
                }}
                required={true}
                disabled={disabled}
                tabIndex={tabIndex}
            >
                <Option value=""></Option>
                {
                    optionsWithTranslations.map(({label, value}) => (
                        <Option key={value} value={value}>{label}</Option>
                    ))
                }
            </Select>
        );
    }
}
