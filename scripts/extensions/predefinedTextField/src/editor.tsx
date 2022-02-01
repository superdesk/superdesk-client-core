import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {IPredefinedFieldConfig} from './interfaces';
import {Select, Option, Icon} from 'superdesk-ui-framework/react';

import {superdesk} from './superdesk';

const {Editor3Html} = superdesk.components;
const {gettext} = superdesk.localization;

type IProps = IEditorComponentProps<string, IPredefinedFieldConfig>;

interface IState {
    freeText: boolean;
}

export class PredefinedFieldEditor extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            freeText: false,
        };
    }

    render() {
        const selectedValue = this.props.value ?? '';
        const options = this.props.config.options ?? [];

        const selectedOption = options.find(({definition}) => definition === this.props.value);
        const fieldReadOnly = this.props.readOnly;

        return (
            <div>
                <Select
                    value={selectedOption?.title ?? ''}
                    onChange={(title) => {
                        if (title === '') {
                            this.props.setValue('');
                        } else {
                            const selected = options.find((option) => option.title === title);

                            if (selected != null) {
                                this.setState({freeText: false});
                                this.props.setValue(selected.definition);
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
                    if (selectedValue === '') {
                        return null;
                    }

                    const value = selectedOption?.definition ?? this.props.value;
                    const freeTextAllowed = this.state.freeText === true || selectedOption == null;

                    return (
                        <div>
                            <br />

                            <div style={{width: '100%', display: 'flex', alignItems: 'top'}}>
                                {
                                    (!fieldReadOnly && freeTextAllowed !== true) && (
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
                                        value={value}
                                        onChange={(val) => {
                                            this.props.setValue(val);
                                        }}
                                        readOnly={fieldReadOnly || freeTextAllowed !== true}
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
