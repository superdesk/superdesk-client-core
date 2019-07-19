import React from 'react';
import PropTypes from 'prop-types';
import {TypeIcon} from '../index';
import {IPropsItemListInfo} from '../ListItemInfo';

export const type: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    if (props.item.type == null) {
        return null;
    }

    const {_type, highlight} = props.item;

    return (
        <span>
            <TypeIcon type={_type} highlight={highlight} />
        </span>
    );
};

type.propTypes = {
    item: PropTypes.any,
};
