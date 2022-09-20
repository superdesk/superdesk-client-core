import {IValidationResults} from '@superdesk/common';
import * as React from 'react';
import {DurationInput, TimePicker, DatePickerISO} from 'superdesk-ui-framework/react';

import * as Form from 'superdesk-ui-framework/react/components/Form';
import {IRundown, IRundownTemplateBase} from '../../../interfaces';

import {superdesk} from '../../../superdesk';

const {gettext} = superdesk.localization;

interface IProps<T extends Partial<IRundownTemplateBase> | IRundown> {
    value: T;
    onChange(change: Partial<T>): void;
    readOnly: boolean;
    validationErrors: IValidationResults<T>;
}

export class AiringInfoBlock<T extends Partial<IRundownTemplateBase> | IRundown>
    extends React.PureComponent<IProps<T>> {
    render() {
        const fields = this.props.value;
        const {readOnly, validationErrors} = this.props;

        return (
            <Form.FormGroup inlineLabel={false}>
                <Form.FormItem>
                    <DurationInput
                        label={gettext('Planned duration')}
                        seconds={fields.planned_duration ?? 0}
                        onChange={(val) => {
                            this.props.onChange({
                                ...fields,
                                planned_duration: val,
                            });
                        }}
                        disabled={readOnly}
                        error={validationErrors.planned_duration ?? undefined}
                        invalid={validationErrors.planned_duration != null}
                    />
                </Form.FormItem>

                <Form.FormItem>
                    <TimePicker
                        label={gettext('Air time')}
                        value={fields.airtime_time ?? ''}
                        onChange={(val) => {
                            this.props.onChange({
                                ...fields,
                                airtime_time: val,
                            });
                        }}
                        disabled={readOnly}
                        error={validationErrors.airtime_time ?? undefined}
                        invalid={validationErrors.airtime_time != null}
                    />
                </Form.FormItem>

                <Form.FormItem>
                    <DatePickerISO
                        label={gettext('Air date')}
                        dateFormat={superdesk.instance.config.view.dateformat}
                        value={fields.airtime_date ?? ''}
                        onChange={(val) => {
                            this.props.onChange({
                                ...fields,
                                airtime_date: val,
                            });
                        }}
                        disabled={readOnly}
                    />
                </Form.FormItem>
            </Form.FormGroup>
        );
    }
}
