import * as React from 'react';
import {Checkbox} from 'superdesk-ui-framework/react';
import {IConfigComponentProps, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {IEditor3Config} from './interfaces';
import {gettext} from 'core/utils';
import {MultiSelect} from 'core/ui/components/MultiSelect';
import {EDITOR3_RICH_FORMATTING_OPTIONS} from 'apps/workspace/content/components/get-content-profiles-form-config';

export class Config extends React.PureComponent<IConfigComponentProps<IEditor3Config>> {
    render() {
        const config = this.props.config ?? {};

        return (
            <div>
                <div>{gettext('Formatting options')}</div>
                <MultiSelect
                    items={EDITOR3_RICH_FORMATTING_OPTIONS.map((label) => ({id: label, label}))}
                    values={config?.editorFormat ?? []}
                    onChange={(editorFormat: Array<RICH_FORMATTING_OPTION>) => {
                        this.props.onChange({...config, editorFormat});
                    }}
                />

                <br />

                <div>{gettext('Minimum length')}</div>

                <input
                    type="number"
                    value={config.minLength}
                    onChange={(event) => {
                        this.props.onChange({...config, minLength: parseInt(event.target.value, 10)});
                    }}
                />

                <br />

                <div>{gettext('Maximum length')}</div>

                <input
                    type="number"
                    value={config.maxLength}
                    onChange={(event) => {
                        this.props.onChange({...config, maxLength: parseInt(event.target.value, 10)});
                    }}
                />

                <br />
                <br />

                <Checkbox
                    label={{text: gettext('Single line')}}
                    checked={config?.singleLine ?? false}
                    onChange={(val) => {
                        this.props.onChange({...config, singleLine: val});
                    }}
                />

                <br />

                <Checkbox
                    label={{text: gettext('Clean pasted HTML')}}
                    checked={config?.cleanPastedHtml ?? false}
                    onChange={(val) => {
                        this.props.onChange({...config, cleanPastedHtml: val});
                    }}
                />
            </div>
        );
    }
}
