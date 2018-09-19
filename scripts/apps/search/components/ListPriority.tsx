import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {renderArea} from '../helpers';

export const ListPriority: React.StatelessComponent<any> = (props) => {
    const css = {
        className: classNames('list-field urgency', {
            'urgency-reduced-rowheight': props.scope.singleLine,
        }),
    };

    return renderArea('priority', props, css) || React.createElement('div', css);
};

ListPriority.propTypes = {
    svc: PropTypes.object.isRequired,
    scope: PropTypes.any.isRequired,
};
