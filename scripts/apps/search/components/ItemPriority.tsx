import React from 'react';
import PropTypes from 'prop-types';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';

export const ItemPriority:React.StatelessComponent<any> = (props) => {
    const {metadata, gettextCatalog} = props.svc;

    var priority = props.priority || 3;
    var spec = metadata.priorityByValue(priority);

    if (spec) {
        return React.createElement(
            'span',
            {
                className: 'badge badge--square priority-label--' + priority,
                style: getSpecStyle(spec),
                title: getSpecTitle(spec, gettextCatalog.getString('Priority')),
                key: 'priority',
            },
            getSpecValue(spec, priority)
        );
    }

    return React.createElement(
        'span',
        {
            className: 'badge badge--square priority-label--' + priority,
            title: gettextCatalog.getString('Priority'),
            key: 'priority',
        },
        priority
    );
}

ItemPriority.propTypes = {
    svc: PropTypes.object.isRequired,
    priority: PropTypes.any,
};
