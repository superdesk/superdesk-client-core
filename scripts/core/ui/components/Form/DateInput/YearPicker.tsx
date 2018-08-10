import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {range, chunk} from 'lodash';

import {Button} from '../../';

import './style.scss';

/**
 * @ngdoc react
 * @name YearPicker
 * @description Component to Pick years of DatePicker
 */
export const YearPicker:React.StatelessComponent<any> = ({selectedDate, onChange, startingYear, yearRange}) => {
    const yRange = yearRange || 20;
    const years = range(startingYear, startingYear + yRange); // plus one to include the last number as welln
    const rows = chunk(years, 5);

    return (
        <table>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((year, index) => (
                            <td key={index} className="text-center">
                                <Button
                                    className={(startingYear + (rowIndex * 5 + index)) === selectedDate.year() ?
                                        'active' :
                                        null
                                    }
                                    onClick={onChange.bind(
                                        this,
                                        (moment(selectedDate).year((startingYear + (rowIndex * 5 + index))))
                                    )}
                                >
                                    <span>{year}</span>
                                </Button>
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

YearPicker.propTypes = {
    selectedDate: PropTypes.object.isRequired,
    startingYear: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    yearRange: PropTypes.number,
};
