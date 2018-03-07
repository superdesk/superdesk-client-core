import React from 'react';
import PropTypes from 'prop-types';
import {getSpecStyle, getSpecTitle, getSpecValue} from '../helpers';

export function ItemUrgency(props) {
    const {metadata, gettextCatalog} = props.svc;

    var urgency = props.urgency || 3;
    var spec = metadata.urgencyByValue(urgency);

    if (spec) {
        return React.createElement(
            'span',
            {
                className: 'badge sd-grid-item__footer-block-item urgency-label--' + urgency,
                title: getSpecTitle(spec, gettextCatalog.getString('Urgency')),
                style: getSpecStyle(spec),
                key: 'urgency'
            },
            getSpecValue(spec, urgency)
        );
    }

    return React.createElement(
        'span',
        {
            className: 'badge sd-grid-item__footer-block-item urgency-label--' + urgency,
            title: gettextCatalog.getString('Urgency'),
            key: 'urgency'
        },
        urgency
    );
}

ItemUrgency.propTypes = {
    svc: PropTypes.object.isRequired,
    urgency: PropTypes.any
};
