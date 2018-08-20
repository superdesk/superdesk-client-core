import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {chunk} from 'lodash';

import {Button} from '../../';

import './style.scss';

/**
 * @ngdoc react
 * @name MonthPicker
 * @description Component to Pick months of DatePicker
 */
export const MonthPicker:React.StatelessComponent<any> = ({selectedDate, onChange}) => {
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY',
        'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const rows = chunk(monthNames, 3);

    return (
        <table>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((date, index) => (
                            <td key={index} className="text-center">
                                <Button
                                    className={(rowIndex * 3 + index) === selectedDate.month() ? 'active' : null}
                                    onClick={
                                        onChange.bind(this, (moment(selectedDate).month((rowIndex * 3 + index))))
                                    }
                                >
                                    <span>{date}</span>
                                </Button>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

MonthPicker.propTypes = {
    selectedDate: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};
