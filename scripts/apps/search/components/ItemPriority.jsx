import React from 'react';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';

export function ItemPriority(props) {
    const {metadata, gettextCatalog} = props.svc;

    var priority = props.priority || 3;
    var spec = metadata.priorityByValue(priority);

    if (spec) {
        return React.createElement(
            'span',
            {
                className: 'priority-label priority-label--' + priority,
                style: getSpecStyle(spec),
                title: getSpecTitle(spec, gettextCatalog.getString('Priority')),
                key: 'priority'
            },
            getSpecValue(spec, priority)
        );
    }

    return React.createElement(
        'span',
        {
            className: 'priority-label priority-label--' + priority,
            title: gettextCatalog.getString('Priority'),
            key: 'priority'
        },
        priority
    );
}

ItemPriority.propTypes = {
    svc: React.PropTypes.object.isRequired,
    priority: React.PropTypes.any
};
