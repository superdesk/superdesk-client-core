import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {values} from 'lodash';

import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {ICON_COLORS} from './constants';

/**
 * @ngdoc react
 * @name Icon
 * @description Generic Icon component with tooltip
 */
const Icon = ({icon, doubleSize, big, className, tooltip, color}) => {
    const iconElement = (
        <i className={classNames(
            icon,
            {
                'icon--2x': doubleSize,
                'double-size-icn': big,
            },
            color,
            className
        )} />
    );

    return tooltip ? (
        <OverlayTrigger overlay={
            <Tooltip id="icon_list_item">{tooltip}</Tooltip>
        }>
            {iconElement}
        </OverlayTrigger>
    ) :
        iconElement;
};

Icon.propTypes = {
    icon: PropTypes.string,
    big: PropTypes.bool,
    doubleSize: PropTypes.bool,
    className: PropTypes.string,
    tooltip: PropTypes.string,
    color: PropTypes.oneOf(values(ICON_COLORS)),
};

Icon.defaultProps = {
    big: false,
    doubleSize: false,
};

export default Icon;
