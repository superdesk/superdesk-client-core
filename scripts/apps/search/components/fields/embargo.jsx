import React from 'react';

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
    svc: React.PropTypes.any.isRequired,
    item: React.PropTypes.any,
};
