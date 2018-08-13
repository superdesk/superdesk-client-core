import React from 'react';
import PropTypes from 'prop-types';

export const embargo:React.StatelessComponent<any> = (props) => {
    const {gettext} = props.svc;

    if (props.item.embargo) {
        return React.createElement(
            'span',
            {className: 'state-label state_embargo', title: gettext('embargo'), key: 'embargo'},
            gettext('embargo')
        );
    }
};

embargo.propTypes = {
    svc: PropTypes.any.isRequired,
    item: PropTypes.any,
};
