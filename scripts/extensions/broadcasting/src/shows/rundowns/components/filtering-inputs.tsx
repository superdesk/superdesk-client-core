import * as React from 'react';
import {
    TimePicker,
    DurationInput,
    DatePickerISO,
} from 'superdesk-ui-framework/react';
import * as Form from 'superdesk-ui-framework/react/components/Form';
import {IRundownFilters} from '../../../interfaces';
import {SelectShow} from './select-show';

import {superdesk} from '../../../superdesk';

const {Spacer} = superdesk.components;
const {gettext} = superdesk.localization;

interface IProps {
    filters: IRundownFilters;
    onChange(filters: Partial<IRundownFilters>): void;
}

export class FilteringInputs extends React.PureComponent<IProps> {
    render() {
        const {filters} = this.props;

        return (
            <React.Fragment>
                <Form.FormGroup>
                    <Form.FormItem>
                        <SelectShow
                            value={filters.show ?? null}
                            onChange={(val) => {
                                this.props.onChange({show: val});
                            }}
                            required={false}
                        />
                    </Form.FormItem>
                </Form.FormGroup>

                <Form.FormGroup>
                    <Form.FormItem>
                        <Spacer h gap="4" justifyContent="space-between">
                            <TimePicker
                                label={gettext('Airtime time from')}
                                value={filters.airtime_date?.gt ?? ''}
                                onChange={(val) => {
                                    this.props.onChange({
                                        airtime_time: {
                                            ...filters.airtime_time,
                                            gt: val,
                                        },
                                    });
                                }}
                            />

                            <TimePicker
                                label={gettext('Airtime time to')}
                                value={filters.airtime_date?.lt ?? ''}
                                onChange={(val) => {
                                    this.props.onChange({
                                        airtime_time: {
                                            ...filters.airtime_time,
                                            lt: val,
                                        },
                                    });
                                }}
                            />
                        </Spacer>
                    </Form.FormItem>
                </Form.FormGroup>

                <Form.FormGroup>
                    <Form.FormItem>
                        <Spacer h gap="4" justifyContent="space-between">
                            <DatePickerISO
                                label={gettext('Airtime date from')}
                                dateFormat={superdesk.instance.config.view.dateformat}
                                value={filters.airtime_date?.gt ?? ''}
                                onChange={(val) => {
                                    this.props.onChange({
                                        airtime_date: {
                                            ...filters.airtime_date,
                                            gt: val,
                                        },
                                    });
                                }}
                            />

                            <DatePickerISO
                                label={gettext('Airtime date to')}
                                dateFormat={superdesk.instance.config.view.dateformat}
                                value={filters.airtime_date?.lt ?? ''}
                                onChange={(val) => {
                                    this.props.onChange({
                                        airtime_date: {
                                            ...filters.airtime_date,
                                            lt: val,
                                        },
                                    });
                                }}
                            />
                        </Spacer>
                    </Form.FormItem>
                </Form.FormGroup>

                <Form.FormGroup>
                    <Form.FormItem>
                        <Spacer h gap="4" justifyContent="space-between">
                            <DurationInput
                                label={gettext('Duration from')}
                                seconds={filters.duration?.gt ?? 0}
                                onChange={(val) => {
                                    this.props.onChange({
                                        duration: {
                                            ...filters.duration,
                                            gt: val,
                                        },
                                    });
                                }}
                            />

                            <DurationInput
                                label={gettext('Duration to')}
                                seconds={filters.duration?.lt ?? 0}
                                onChange={(val) => {
                                    this.props.onChange({
                                        duration: {
                                            ...filters.duration,
                                            lt: val,
                                        },
                                    });
                                }}
                            />
                        </Spacer>
                    </Form.FormItem>
                </Form.FormGroup>
            </React.Fragment>
        );
    }
}
