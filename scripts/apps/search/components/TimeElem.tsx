import React from 'react';
import PropTypes from 'prop-types';

export function TimeElem(props) {
    const {datetime} = props.svc;

    return React.createElement(
        'time',
        {title: datetime.longFormat(props.date)},
        datetime.shortFormat(props.date)
    );
}

TimeElem.propTypes = {
    svc: PropTypes.object.isRequired,
    date: PropTypes.any,
};
