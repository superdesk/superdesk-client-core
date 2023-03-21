import * as React from 'react';
import {IEditorComponentProps, IFieldsData} from 'superdesk-api';
import {IConfig, IExtensionConfigurationOptions, IValueOperational} from './interfaces';
import {Select, Option, Icon} from 'superdesk-ui-framework/react';

import {superdesk} from './superdesk';

const {Editor3Html} = superdesk.components;
const {gettext} = superdesk.localization;

type IProps = IEditorComponentProps<IValueOperational, IConfig, never>;

interface IState {
    freeText: boolean;
}

function applyPlaceholders(definition: string, fieldsData: IFieldsData): string {
    const extensionConfig: IExtensionConfigurationOptions = superdesk.getExtensionConfig();

    let result = definition;

    for (let [placeholderName, fieldId] of Object.entries(extensionConfig.placeholderMapping ?? {})) {
        result = result.replace(`{{${placeholderName}}}`, (fieldsData.get(fieldId) as string) ?? '');
    }

    return result;
}

export class Editor extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            freeText: false,
        };
    }

    render() {
        const selectedValue = this.props.value ?? '';
        const options = this.props.config.options ?? [];
        const allowSwitchingToFreeText = this.props.config.allowSwitchingToFreeText ?? false;

        const selectedOption = options.find(({definition}) =>
            applyPlaceholders(definition, this.props.fieldsData) === this.props.value);

        const freeTextMode = this.state.freeText === true || selectedOption == null;

        const fieldReadOnly = this.props.readOnly;

        return (
            <div>
                <Select
                    label={gettext('Select from a predefined value')}
                    labelHidden={true}
                    inlineLabel={true}
                    value={selectedOption?.title ?? ''}
                    onChange={(title) => {
                        if (title === '' && !freeTextMode) {
                            this.props.onChange('');
                        } else {
                            const selected = options.find((option) => option.title === title);

                            if (selected != null) {
                                this.setState({freeText: false});
                                this.props.onChange(applyPlaceholders(selected.definition, this.props.item));
                            }
                        }
                    }}
                    disabled={fieldReadOnly}
                >
                    <Option value="" />

                    {
                        options.map((option, i) => (
                            <Option key={i} value={option.title}>{option.title}</Option>
                        ))
                    }
                </Select>

                {(() => {
                    if (selectedValue === '' && !freeTextMode) {
                        return null;
                    }

                    const value = typeof selectedOption?.definition === 'string'
                        ? applyPlaceholders(selectedOption.definition, this.props.fieldsData)
                        : this.props.value;

                    return (
                        <div>
                            <br />

                            <div style={{width: '100%', display: 'flex', alignItems: 'top'}}>
                                {
                                    (allowSwitchingToFreeText && !fieldReadOnly && freeTextMode !== true) && (
                                        <div>
                                            <button
                                                title={gettext('Use custom value')}
                                                onClick={() => {
                                                    this.setState({freeText: true});
                                                }}
                                            >
                                                <Icon name="unlocked" ariaHidden />
                                            </button>
                                        </div>
                                    )
                                }

                                <div style={{flexGrow: 1}}>
                                    <Editor3Html
                                        value={value ?? ''}
                                        onChange={(val) => {
                                            this.props.onChange(val);
                                        }}
                                        readOnly={fieldReadOnly || freeTextMode !== true}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        );
    }
}
