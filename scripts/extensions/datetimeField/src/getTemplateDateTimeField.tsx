import {ISuperdesk, ITemplateEditorComponentProps} from 'superdesk-api';
import * as React from 'react';
import {IDateTimeFieldConfig, isDateValue} from './extension';
import {Radio, CheckGroup} from 'superdesk-ui-framework';
import {getDateTimeField} from './getDateTimeField';
import {Switch} from 'superdesk-ui-framework/react';
import addMinutes from 'date-fns/addMinutes';

interface IState {
    radioValue: 'setCurrentDate' | 'showDate' | null;
    previousValue: any;
}

export function getTemplateDateTimeField(superdesk: ISuperdesk) {
    const {Spacer} = superdesk.components;
    const currentDateTime = '{{ now|iso_datetime }}';
    const DateTimeField = getDateTimeField(superdesk);
    const {dateToServerString} = superdesk.utilities;

    return class TemplateDateTimeField extends
        React.PureComponent<ITemplateEditorComponentProps<string | null, IDateTimeFieldConfig>,
        IState> {
        constructor(props: any) {
            super(props);

            this.state = {
                radioValue: isDateValue(this.props.value) ? 'showDate' : 'setCurrentDate',
                previousValue: new Date(),
            };

            this.onRadioValueChange = this.onRadioValueChange.bind(this);
        }

        onRadioValueChange(radioValue: any) {
            this.setState({radioValue});
            if (radioValue === 'setCurrentDate') {
                this.props.setValue(currentDateTime);
            } else {
                this.props.setValue(this.state.previousValue);
            }
        }

        render() {
            const {item, value, readOnly, config} = this.props;

            const checkbox = (
                <Switch
                    value={this.props.value != null}
                    onChange={(val) => {
                        if (val) {
                            this.props.setValue(
                                dateToServerString(addMinutes(new Date(), this.props.config.initial_offset_minutes)),
                            );
                        } else {
                            this.props.setValue(null);
                        }
                    }}
                />
            );

            const radiobutton = (
                <CheckGroup>
                    <Radio
                        value={this.props.value || undefined}
                        options={[
                            {
                                value: 'setCurrentDate',
                                label: 'Always choose current date',
                            },
                            {
                                value: 'showDate',
                                label: 'Choose a date',
                            },
                        ]}
                        onChange={(val) => this.onRadioValueChange(val)}
                    />
                </CheckGroup>
            );

            return (
                <Spacer type="horizontal" align="center" spacing="medium">
                    {checkbox}
                    {value && radiobutton}
                    {
                        this.state.radioValue === 'showDate' && (
                            <DateTimeField
                                item={item}
                                value={value}
                                setValue={this.props.setValue}
                                readOnly={readOnly}
                                config={config}
                                hideToggle={true}
                            />
                        )
                    }
                </Spacer>
            );
        }
    };
}
