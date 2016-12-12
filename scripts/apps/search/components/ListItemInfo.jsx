import React from 'react';
import classNames from 'classnames';

import {renderArea} from 'apps/search/helpers';
import {DEFAULT_LIST_CONFIG} from 'apps/search/constants';

export function ListItemInfo(props) {
    const {config} = props.svc;
    const listConfig = config.list || DEFAULT_LIST_CONFIG;

    return React.createElement(
        'div',
        {className: classNames('item-info', {'item-info-reduced-rowheight': listConfig.thinRows})},
        renderArea('firstLine', angular.extend({
            svc: props.svc,
            scope: props.scope
        }, props), {className: 'line'}),
        renderArea('secondLine', angular.extend({
            svc: props.svc,
            scope: props.scope
        }, props), {className: 'line'})
    );
}

ListItemInfo.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired
};
