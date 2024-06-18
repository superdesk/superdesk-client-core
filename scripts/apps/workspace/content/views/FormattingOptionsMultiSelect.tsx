import React from 'react';
import {TreeSelect} from 'superdesk-ui-framework/react';
import {RICH_FORMATTING_OPTION} from 'superdesk-api';
import {gettext} from 'core/utils';

interface IProps {
    value: Array<string> | null;
    onChange(value: Array<string>): void;
    options: Array<{value: [RICH_FORMATTING_OPTION, string]}>;
}

export class FormattingOptionsTreeSelect extends React.Component<IProps> {
    render(): React.ReactNode {
        const lookup: Map<RICH_FORMATTING_OPTION, string> = new Map(
            this.props.options.map(({value}) => value),
        );

        const values: Array<[RICH_FORMATTING_OPTION, string]> =
            (this.props.value ?? []).map((id: RICH_FORMATTING_OPTION) => [id, lookup.get(id)]);

        return (
            <TreeSelect
                data-test-id="formatting-options"
                kind="synchronous"
                getId={(option) => option[0]}
                getLabel={(option) => option[1]}
                getOptions={() => this.props.options}
                onChange={(newFormattingOptions) => {
                    this.props.onChange(newFormattingOptions.map((option) => option[0]));
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
