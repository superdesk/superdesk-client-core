import React from 'react';
import PropTypes from 'prop-types';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';
import {gettext} from 'core/ui/components/utils';

export const ItemPriority: React.StatelessComponent<any> = (props) => {
    const {metadata} = props.svc;

    const priority = props.priority || 3;
    const spec = metadata.priorityByValue(priority);

    if (spec) {
        return React.createElement(
            'span',
            {
                className: 'badge badge--square priority-label--' + priority,
                style: getSpecStyle(spec),
                title: getSpecTitle(spec, gettext('Priority')),
                key: 'priority',
            },
            getSpecValue(spec, priority),
        );
    }

    return React.createElement(
        'span',
        {
            className: 'badge badge--square priority-label--' + priority,
            title: gettext('Priority'),
            key: 'priority',
        },
        priority,
    );
};

ItemPriority.propTypes = {
    svc: PropTypes.object.isRequired,
    priority: PropTypes.any,
};
