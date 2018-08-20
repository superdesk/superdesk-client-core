import React from 'react';
import PropTypes from 'prop-types';
import {values} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import classNames from 'classnames';

import {ICON_COLORS} from './constants';
import Icon from './Icon';

/**
 * @ngdoc react
 * @name IconMix
 * @description Mixing two icons
 */
const IconMix:React.StatelessComponent<any> = ({icon, subIcon, big, doubleSize, className, tooltip, color}) => {
    let iconElement;

    if (subIcon) {
        if (big) {
            iconElement = (
                <span className={classNames('icn-mix', className)}>
                    <Icon className="icn-mix__sub-icn" icon={subIcon} big={true} color={color} />
                    <span className="double-size-icn double-size-icn--light">
                        <Icon icon={icon} color={color}/>
                    </span>
                </span>
            );
        } else if (doubleSize) {
            iconElement = (
                <span className={classNames('icn-mix', 'icn-mix--2x', className)}>
                    <Icon icon={subIcon} className="icn-mix__sub-icn" color={color}/>
                    <Icon icon={icon} doubleSize={doubleSize} big={big} color={color} />
                </span>
            );
        } else {
            iconElement = (
                <span className={classNames('icn-mix', className)}>
                    <Icon icon={subIcon} className="icn-mix__sub-icn" color={color}/>
                    <Icon icon={icon} doubleSize={doubleSize} big={big} color={color} />
                </span>
            );
        }
    } else if (big) {
        iconElement = (
            <div className={classNames('double-size-icn', 'double-size-icn--light', className)}>
                <Icon icon={icon} color={color}/>
            </div>
        );
    } else {
        iconElement = (
            <Icon
                className={className}
                icon={icon}
                doubleSize={doubleSize}
                color={color}
            />
        );
    }

    return tooltip ? (
        <OverlayTrigger overlay={
            <Tooltip id="icon_list_item">{tooltip}</Tooltip>
        }>
            {iconElement}
        </OverlayTrigger>
    ) :
        iconElement;
};

IconMix.propTypes = {
    icon: PropTypes.string,
    subIcon: PropTypes.string,
    big: PropTypes.bool,
    doubleSize: PropTypes.bool,
    className: PropTypes.string,
    tooltip: PropTypes.string,
    color: PropTypes.oneOf(values(ICON_COLORS)),
};

IconMix.defaultProps = {
    big: false,
    doubleSize: false,
};

export default IconMix;
