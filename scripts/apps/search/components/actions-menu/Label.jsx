import React from 'react';
import PropTypes from 'prop-types';
import {closeActionsMenu} from 'apps/search/helpers';

export default function Label(props) {
    const {gettextCatalog} = props.svc;

    return React.createElement(
        'li',
        null,
        React.createElement('div', {
            className: 'dropdown__menu-label'
        }, gettextCatalog.getString(props.label),
        props.label === 'Actions' ? React.createElement(
            'button',
            {className: 'dropdown__menu-close', onClick: closeActionsMenu},
            React.createElement(
                'i',
                {className: 'icon-close-small'}
            )
        ) : null
        )
    );
}

Label.propTypes = {
    svc: PropTypes.object.isRequired,
    label: PropTypes.any,
};
