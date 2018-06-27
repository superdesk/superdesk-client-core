import React from 'react';
import PropTypes from 'prop-types';
import {TypeIcon} from '../index';

export function type(props) {
    if (props.item.type == null) {
        return null;
    }

    const {type, highlight} = props.item;

    return (
        <span className={props.className}>
            <TypeIcon type={type} highlight={highlight} svc={props.svc} />
        </span>
    );
}

type.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
    className: PropTypes.string,
};
