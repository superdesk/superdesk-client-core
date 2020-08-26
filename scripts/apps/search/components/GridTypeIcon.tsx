import React from 'react';
import PropTypes from 'prop-types';
import {TypeIcon} from './index';
import classNames from 'classnames';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    photoGrid?: any;
    swimlane?: any;
}

export const GridTypeIcon: React.StatelessComponent<IProps> = (props) => {
    if (props.photoGrid) {
        return React.createElement('span',
            {className: classNames('sd-grid-item__type-icn',
                {swimlane: props.swimlane},
            )},
            React.createElement(TypeIcon, {type: props.item.type}),
        );
    }

    return React.createElement(
        'span',
        {},
        React.createElement(TypeIcon, {type: props.item.type}),
    );
};

GridTypeIcon.propTypes = {
    swimlane: PropTypes.any,
    item: PropTypes.any,
    photoGrid: PropTypes.bool,
};
