import React from 'react';
import classNames from 'classnames';
import {renderArea} from 'apps/search/helpers';
import {DEFAULT_LIST_CONFIG} from 'apps/search/constants';

export function ListPriority(props) {
    const {config} = props.svc;
    var listConfig = config.list || DEFAULT_LIST_CONFIG;
    var css = {
        className: classNames('list-field urgency', {
            'urgency-reduced-rowheight': listConfig.thinRows
        })
    };

    return renderArea('priority', props, css) || React.createElement('div', css);
}

ListPriority.propTypes = {
    svc: React.PropTypes.object.isRequired,
};
