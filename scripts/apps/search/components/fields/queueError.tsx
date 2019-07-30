import React from 'react';
import PropTypes from 'prop-types';
import {QueueError} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const queueError: React.StatelessComponent<IPropsItemListInfo> = (props) => (
    <QueueError
        item={props.item}
        key="queueError"
    />
);

/*
 * item: published item having queue errors
 */
queueError.propTypes = {
    item: PropTypes.any,
};
