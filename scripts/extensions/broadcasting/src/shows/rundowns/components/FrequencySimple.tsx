import * as React from 'react';
import {CheckboxButton, CheckButtonGroup} from 'superdesk-ui-framework/react';
import {IRRule} from '../../../interfaces';
import {getWeekdayNames} from '@superdesk/common';

interface IProps {
    value: IRRule | undefined | null;
    onChange(val: IRRule): void;
    firstDayOfWeek: number; // [0, 6] ; 0 is Monday
    readOnly: boolean;
}

/**
 * Only supports recurrence every week on selected days
 */
export class FrequencySimple extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            canSelectMultipleDays: true,
        };
    }

    render() {
        const rrule: IRRule = this.props.value ?? {
            freq: 'WEEKLY',
            interval: 1,
            by_day: [],
        };

        const daysObj: {[key: number]: boolean} = {};

        for (const dayIndex of rrule.by_day ?? []) {
            daysObj[dayIndex] = true;
        }

        return (
            <CheckButtonGroup>
                {
                    getWeekdayNames('short', this.props.firstDayOfWeek).map(({label, index}) => (
                        <CheckboxButton
                            key={index}
                            checked={daysObj[index] === true}
                            label={{text: label}}
                            onChange={(val) => {
                                if (val === true) {
                                    this.props.onChange({
                                        ...rrule,
                                        by_day: (rrule.by_day ?? []).concat(index).sort((a, b) => a - b),
                                    });
                                } else {
                                    this.props.onChange({
                                        ...rrule,
                                        by_day: (rrule.by_day ?? []).filter((_val) => _val !== index),
                                    });
                                }
                            }}
                            disabled={this.props.readOnly}
                        />
                    ))
                }
            </CheckButtonGroup>
        );
    }
}
