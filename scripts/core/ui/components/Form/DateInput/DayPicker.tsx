import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {range, chunk} from 'lodash';
import classNames from 'classnames';

import {Button} from '../../';

import './style.scss';

/**
 * @ngdoc react
 * @name DayPicker
 * @description Component to Pick days of DatePicker
 */
export class DayPicker extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {
            dates: [],
            selectedDateIndex: -1,
            monthStartIndex: -1,
            monthEndIndex: -1,
        };
    }

    componentWillMount() {
        this.setDatesForProps(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props !== nextProps) {
            this.setDatesForProps(nextProps);
        }
    }

    setDatesForProps(props) {
        const firstDayOfMonth = moment().year(props.selectedDate.year())
            .month(props.selectedDate.month())
            .date(1)
            .isoWeekday();

        const daysInCurrentMonth = range(1, props.selectedDate.daysInMonth() + 1);

        let prevMonthDates = [];

        if (firstDayOfMonth !== 7) { // In this case, need to also have dates of previous month in the view
            const previousYear = props.selectedDate.month() === 0 ? props.selectedDate.year() - 1 :
                props.selectedDate.year();
            const previousMonth = props.selectedDate.month() === 0 ? 11 :
                props.selectedDate.month() - 1;
            const daysOfPreviousMonth = this.getDaysInMonth(previousYear, previousMonth);

            prevMonthDates = range(daysOfPreviousMonth - firstDayOfMonth + 1, daysOfPreviousMonth + 1);
        }

        const nextMonthDates = range(1, 43 - (prevMonthDates.length + daysInCurrentMonth.length));

        this.setState({
            dates: [...prevMonthDates,
                ...daysInCurrentMonth,
                ...nextMonthDates],
            selectedDateIndex: daysInCurrentMonth.indexOf(props.selectedDate.date())
                + prevMonthDates.length,
            monthStartIndex: prevMonthDates.length,
            monthEndIndex: prevMonthDates.length + daysInCurrentMonth.length - 1,
        });
    }

    getDaysInMonth(year, month) {
        const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        return ((month === 1) && (year % 4 === 0) &&
            ((year % 100 !== 0) || (year % 400 === 0))) ? 29 : DAYS_IN_MONTH[month];
    }

    onDateChange(index) {
        // Form new moment object and inform the parent component
        const newMoment = this.props.selectedDate.clone();

        if (index < this.state.monthStartIndex) {
            // Date selected was of previous month
            newMoment.subtract(1, 'months').date(this.state.dates[index]);
        } else if (index > this.state.monthEndIndex) {
            // Date selected was of next month
            newMoment.add(1, 'months').date(this.state.dates[index]);
        } else {
            newMoment.date(this.state.dates[index]);
        }
        this.props.onChange(newMoment);
    }

    render() {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const rows = chunk(this.state.dates, 7);

        return (
            <table>
                <thead>
                    <tr>
                        {dayNames.map((day, index) => (
                            <th key={index} className="text-center"><small>{day}</small></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((date, index) => (
                                <td key={index} className="text-center">
                                    <Button
                                        className={(rowIndex * 7 + index) === this.state.selectedDateIndex ?
                                            'active' :
                                            null
                                        }
                                        onClick={this.onDateChange.bind(this, (rowIndex * 7 + index))}
                                    >
                                        <span
                                            className={classNames({
                                                'text-muted':
                                                (rowIndex * 7 + index) < this.state.monthStartIndex ||
                                                (rowIndex * 7 + index) > this.state.monthEndIndex,
                                            })}
                                        >
                                            {date}
                                        </span>
                                    </Button>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}

DayPicker.propTypes = {
    selectedDate: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};
