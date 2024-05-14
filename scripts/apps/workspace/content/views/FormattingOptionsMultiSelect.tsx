import React from 'react';
import {TreeSelect} from 'superdesk-ui-framework/react';
import {IArticleField, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {gettext} from 'core/utils';

interface IProps {
    value: Array<string> | null;
    fieldId: string;
    fields: Dictionary<string, IArticleField>;
    onChange(value: Array<string>, fieldId: string): void;
    formattingOptions: Array<{value: [RICH_FORMATTING_OPTION, string]}>;
}

export class FormattingOptionsTreeSelect extends React.Component<IProps> {
    render(): React.ReactNode {
        const values = this.props.value != null
            ? this.props.formattingOptions
                .filter((option) => this.props.value.includes(option.value[0]))
                .map((option) => option.value)
            : [];

        return (
            <TreeSelect
                kind="synchronous"
                getId={(option) => option[0]}
                getLabel={(option) => option[1]}
                getOptions={() => this.props.formattingOptions}
                onChange={(newFormattingOptions) => {
                    this.props.onChange(newFormattingOptions.map((option) => option[0]), this.props.fieldId);
                }}
                value={values}
                allowMultiple
                fullWidth
                label={gettext('Formatting options')}
                labelHidden
                inlineLabel
                zIndex={1051}
            />
        );
    }
}
