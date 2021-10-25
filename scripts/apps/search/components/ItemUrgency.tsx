import React from 'react';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

interface IProps {
    urgency: number;
    language: string | undefined;
}

export const ItemUrgency: React.StatelessComponent<IProps> = (props) => {
    const metadata = ng.get('metadata');

    const {language} = props;
    const urgency = props.urgency || 3;
    const spec = metadata.urgencyByValue(urgency);

    if (spec) {
        return React.createElement(
            'span',
            {
                className: 'badge urgency-label--' + urgency,
                title: getSpecTitle(spec, gettext('Urgency'), language),
                style: getSpecStyle(spec),
                key: 'urgency',
            },
            getSpecValue(spec, urgency),
        );
    }

    return React.createElement(
        'span',
        {
            className: 'badge urgency-label--' + urgency,
            title: gettext('Urgency'),
            key: 'urgency',
        },
        urgency,
    );
};
