import React from 'react';
import PropTypes from 'prop-types';
import {QueueError} from '../index';

export function queueError(props) {
    return <QueueError
        item={props.item}
        key="queueError"
    />;
}

/*
 * item: published item having queue errors
 */
queueError.propTypes = {
    item: PropTypes.any,
};
