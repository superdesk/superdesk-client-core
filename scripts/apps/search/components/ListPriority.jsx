import React from 'react';
import classNames from 'classnames';
import {renderArea} from 'apps/search/helpers';

export function ListPriority(props) {
    const {config} = props.svc;
    var reduceRowHeight = props.scope.singleLine || _.get(config, 'list.priority.length') > 1;
    var css = {
        className: classNames('list-field urgency', {
            'urgency-reduced-rowheight': reduceRowHeight
        })
    };

    return renderArea('priority', props, css) || React.createElement('div', css);
}

ListPriority.propTypes = {
    svc: React.PropTypes.object.isRequired,
    scope: React.PropTypes.any.isRequired
};
