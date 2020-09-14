import React from 'react';
import PropTypes from 'prop-types';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

export const ItemUrgency: React.StatelessComponent<any> = (props) => {
    const metadata = ng.get('metadata');

    const urgency = props.urgency || 3;
    const spec = metadata.urgencyByValue(urgency);

    if (spec) {
        return React.createElement(
            'span',
            {
                className: 'badge urgency-label--' + urgency,
                title: getSpecTitle(spec, gettext('Urgency')),
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

ItemUrgency.propTypes = {
    urgency: PropTypes.any,
};
