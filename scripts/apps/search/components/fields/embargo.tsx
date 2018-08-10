import React from 'react';
import PropTypes from 'prop-types';

export function embargo(props) {
    const {gettext} = props.svc;

    if (props.item.embargo) {
        return React.createElement(
            'span',
            {className: 'state-label state_embargo', title: gettext('embargo'), key: 'embargo'},
            gettext('embargo')
        );
    }
}

embargo.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
