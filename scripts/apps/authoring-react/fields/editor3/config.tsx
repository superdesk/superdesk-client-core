import * as React from 'react';
import {Checkbox} from 'superdesk-ui-framework/react';
import {IConfigComponentProps, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {IEditor3Config} from './interfaces';
import {gettext} from 'core/utils';
import {MultiSelect} from 'core/ui/components/MultiSelect';
import {EDITOR3_RICH_FORMATTING_OPTIONS} from 'apps/workspace/content/components/get-content-profiles-form-config';

export class Config extends React.PureComponent<IConfigComponentProps<IEditor3Config>> {
    render() {
        return (
            <div>
                <div>{gettext('Formatting options')}</div>
                <MultiSelect
                    items={EDITOR3_RICH_FORMATTING_OPTIONS.map((label) => ({id: label, label}))}
                    values={this.props.config?.editorFormat ?? []}
                    onChange={(editorFormat: Array<RICH_FORMATTING_OPTION>) => {
                        this.props.onChange({...this.props.config, editorFormat});
                    }}
                />

                <br />

                <div>{gettext('Minimum length')}</div>

                <input
                    type="number"
                    value={this.props.config.minLength}
                    onChange={(event) => {
                        this.props.onChange({...this.props.config, minLength: parseInt(event.target.value, 10)});
                    }}
                />

                <br />

                <div>{gettext('Maximum length')}</div>

                <input
                    type="number"
                    value={this.props.config.maxLength}
                    onChange={(event) => {
                        this.props.onChange({...this.props.config, maxLength: parseInt(event.target.value, 10)});
                    }}
                />

                <br />
                <br />

                <Checkbox
                    label={{text: gettext('Single line')}}
                    checked={this.props.config?.singleLine ?? false}
                    onChange={(val) => {
                        this.props.onChange({...this.props.config, singleLine: val});
                    }}
                />

                <br />

                <Checkbox
                    label={{text: gettext('Clean pasted HTML')}}
                    checked={this.props.config?.cleanPastedHtml ?? false}
                    onChange={(val) => {
                        this.props.onChange({...this.props.config, cleanPastedHtml: val});
                    }}
                />
            </div>
        );
    }
}
