import React from 'react';
import PropTypes from 'prop-types';

export const TimeElem = ({svc, date}) => {
    const {datetime} = svc;

    return (
        <time title={datetime.longFormat(date)}>
            {datetime.shortFormat(date)}
        </time>
    );
};

TimeElem.propTypes = {
    svc: PropTypes.object.isRequired,
    date: PropTypes.any,
};
