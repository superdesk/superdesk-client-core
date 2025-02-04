import React from 'react';
import {IVocabularyItem} from 'superdesk-api';
import {gettext, getVocabularyItemNameTranslated} from 'core/utils';

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
            <div className="sd-line-input sd-line-input--no-label sd-line-input--is-select">
                <select
                    value={selectedValue ?? ''}
                    onChange={(event) => {
                        const _qcode = event.target.value;

                        this.props.onChange(options.find(({qcode}) => qcode === _qcode));
                    }}
                    disabled={disabled}
                    tabIndex={tabIndex}
                    className="sd-line-input__select"
                >
                    <option value="" disabled hidden>{gettext('-- Choose --')}</option>
                    {
                        optionsWithTranslations.map(({label, value}) => (
                            <option key={value} value={value}>{label}</option>
                        ))
                    }
                </select>
            </div>
        );
    }
}
