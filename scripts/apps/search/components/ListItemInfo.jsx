import React from 'react';
import classNames from 'classnames';

import {renderArea} from 'apps/search/helpers';

export function ListItemInfo(props) {
    if (props.scope.singleLine) {
        return React.createElement(
            'div',
            {className: 'item-info item-info-reduced-rowheight'},
            renderArea('singleLine', angular.extend({
                svc: props.svc,
                scope: props.scope
            }, props), {className: 'line'})
        );
    }

    return React.createElement(
        'div',
        {className: classNames('item-info', {'item-info-reduced-rowheight': props.scope.singleLine})},
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
