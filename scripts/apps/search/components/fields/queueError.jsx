import React from 'react';
import {QueueError} from 'apps/search/components';

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
    item: React.PropTypes.any
};
