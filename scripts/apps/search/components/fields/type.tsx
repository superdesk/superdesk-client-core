import React from 'react';
import PropTypes from 'prop-types';
import {TypeIcon} from '../index';

export const type: React.StatelessComponent<any> = (props) => {
    if (props.item.type == null) {
        return null;
    }

    const {_type, highlight} = props.item;

    return (
        <span className={props.className}>
            <TypeIcon type={_type} highlight={highlight} />
        </span>
    );
};

type.propTypes = {
    item: PropTypes.any,
    className: PropTypes.string,
};
