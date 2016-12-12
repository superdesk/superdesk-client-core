import React from 'react';
import {TypeIcon} from 'apps/search/components';
import classNames from 'classnames';

export function GridTypeIcon(props) {
    return React.createElement(
        'span',
        {className: classNames('type-icon', {swimlane: props.swimlane})},
        React.createElement(TypeIcon, {type: props.item.type})
    );
}

GridTypeIcon.propTypes = {
    swimlane: React.PropTypes.any,
    item: React.PropTypes.any
};
