import React from 'react';

export function TimeElem(props) {
    const {datetime} = props.svc;

    return React.createElement(
        'time',
        {title: datetime.longFormat(props.date)},
        datetime.shortFormat(props.date)
    );
}

TimeElem.propTypes = {
    svc: React.PropTypes.object.isRequired,
    date: React.PropTypes.any
};
