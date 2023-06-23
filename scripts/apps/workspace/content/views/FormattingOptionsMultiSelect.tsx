import React from 'react';
import {TreeSelect} from 'superdesk-ui-framework/react';
import {
    HAS_RICH_FORMATTING_OPTIONS,
    getEditor3PlainTextFormattingOptions,
    getEditor3RichFormattingOptions,
} from '../directives/ContentProfileSchemaEditor';
import {IArticleField} from 'superdesk-api';

interface IProps {
    value: Array<string>;
    fieldId: string;
    fields: Dictionary<string, IArticleField>;
    onChange(value: Array<string>, fieldId: string): void;
}

export class FormattingOptionsTreeSelect extends React.Component<IProps> {
    render(): React.ReactNode {
        const {fields, fieldId} = this.props;

        const isCustomPlainTextField = typeof fields[fieldId] === 'object' && fields[fieldId].field_type === 'text';
        const isRichOrCustomTextField =
            Object.keys(HAS_RICH_FORMATTING_OPTIONS).includes(fieldId) || isCustomPlainTextField;
        const formattingOptions = Object.entries(
            isRichOrCustomTextField
                ? getEditor3RichFormattingOptions()
                : getEditor3PlainTextFormattingOptions(),
        )
            .map(([notTranslatedOption, translatedOption]) => ({value: [notTranslatedOption, translatedOption]}));

        const values = formattingOptions
            .filter((option) => this.props.value.includes(option.value[0]))
            .map((option) => option.value);

        return (
            <TreeSelect
                kind="synchronous"
                getId={(option) => option[0]}
                getLabel={(option) => option[1]}
                getOptions={() => formattingOptions}
                onChange={(newFormattingOptions) => {
                    this.props.onChange(newFormattingOptions.map((option) => option[0]), this.props.fieldId);
                }}
                value={values}
                allowMultiple
                fullWidth
                labelHidden
                inlineLabel
                width="100%"
            />
        );
    }
}
