import React from 'react';
import PropTypes from 'prop-types';
import {TypeIcon} from './index';
import classNames from 'classnames';

export function GridTypeIcon(props) {
    if (props.photoGrid) {
        return React.createElement('span',
            {className: classNames('sd-grid-item__type-icn sd-grid-item__footer-block-item',
                {swimlane: props.swimlane}
            )},
            React.createElement(TypeIcon, {type: props.item.type, svc: props.svc})
        );
    }

    return React.createElement(
        'span',
        {className: classNames('type-icon', {swimlane: props.swimlane})},
        React.createElement(TypeIcon, {type: props.item.type, svc: props.svc})
    );
}

GridTypeIcon.propTypes = {
    svc: PropTypes.object.isRequired,
    swimlane: PropTypes.any,
    item: PropTypes.any,
    photoGrid: PropTypes.bool,
};
