import React from 'react';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

interface IProps {
    priority: string;
}

export class ItemPriority extends React.PureComponent<IProps> {
    render() {
        const metadata = ng.get('metadata');

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
