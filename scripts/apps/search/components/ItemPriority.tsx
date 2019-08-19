import React from 'react';
import PropTypes from 'prop-types';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';
import {gettext} from 'core/utils';

interface IProps {
    priority: string;
    svc: {
        metadata: any;
    };
}

export class ItemPriority extends React.PureComponent<IProps> {
    render() {
        const {metadata} = this.props.svc;

        const priority = this.props.priority || 3;
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
    }
}
