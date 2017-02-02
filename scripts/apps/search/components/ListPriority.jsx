import React from 'react';
import classNames from 'classnames';
import {renderArea} from 'apps/search/helpers';

export function ListPriority(props) {
    var css = {
        className: classNames('list-field urgency', {
            'urgency-reduced-rowheight': props.scope.singleLine
        })
    };

    return renderArea('priority', props, css) || React.createElement('div', css);
}

ListPriority.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired
};
