import * as React from 'react';
import {Checkbox} from 'superdesk-ui-framework/react';
import {IConfigComponentProps, IEditor3Config, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {gettext} from 'core/utils';
import {MultiSelect} from 'core/ui/components/MultiSelect';
import {Spacer} from 'core/ui/components/Spacer';
import {getEditor3RichTextFormattingOptions} from 'apps/workspace/content/components/get-content-profiles-form-config';

export class Config extends React.PureComponent<IConfigComponentProps<IEditor3Config>> {
    render() {
        const config = this.props.config ?? {};

        return (
            <Spacer v gap="16">
                <div>
                    <div className="form-label">{gettext('Formatting options')}</div>

                    <MultiSelect
                        items={
                            Object.entries(getEditor3RichTextFormattingOptions())
                                .map(([id, label]) => ({id, label}))
                        }
                        values={config?.editorFormat ?? []}
                        onChange={(editorFormat: Array<RICH_FORMATTING_OPTION>) => {
                            this.props.onChange({...config, editorFormat});
                        }}
                    />
                </div>

                <div>
                    <div className="form-label">{gettext('Minimum length')}</div>

                    <input
                        type="number"
                        value={config.minLength}
                        onChange={(event) => {
                            this.props.onChange({...config, minLength: parseInt(event.target.value, 10)});
                        }}
                    />
                </div>

                <div>
                    <div className="form-label">{gettext('Maximum length')}</div>

                    <input
                        type="number"
                        value={config.maxLength}
                        onChange={(event) => {
                            this.props.onChange({...config, maxLength: parseInt(event.target.value, 10)});
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Single line')}}
                        checked={config?.singleLine ?? false}
                        onChange={(val) => {
                            this.props.onChange({...config, singleLine: val});
                        }}
                    />
                </div>

                <div>
                    <Checkbox
                        label={{text: gettext('Clean pasted HTML')}}
                        checked={config?.cleanPastedHtml ?? false}
                        onChange={(val) => {
                            this.props.onChange({...config, cleanPastedHtml: val});
                        }}
                    />
                </div>

                <div>
                    <div className="form-label">{gettext('Disallowed characters')}</div>

                    <input
                        type="text"
                        value={config.disallowedCharacters?.join('')}
                        onChange={(event) => {
                            this.props.onChange({...config, disallowedCharacters: event.target.value.split('')});
                        }}
                    />
                </div>

                <div>
                    <div className="form-label">{gettext('Field ID to prefill from')}</div>

                    <p>
                        {
                            gettext(
                                'This field will initialize with the value of specified field'
                                + ' when toggled from "off" to "on". Only plain-text gets copied.'
                                + ' Formatting options or links are not preserved.',
                            )
                        }
                    </p>

                    <input
                        type="text"
                        value={config.copyFromFieldOnToggle}
                        onChange={(event) => {
                            this.props.onChange({...config, copyFromFieldOnToggle: event.target.value});
                        }}
                    />
                </div>
            </Spacer>
        );
    }
}
