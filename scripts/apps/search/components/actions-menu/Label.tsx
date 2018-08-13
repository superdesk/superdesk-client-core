import React from 'react';
import PropTypes from 'prop-types';
import {closeActionsMenu} from '../../helpers';

export const Label:React.StatelessComponent<any> = (props) => {
    const {gettextCatalog} = props.svc;

    return React.createElement(
        'li',
        null,
        React.createElement('div', {
            className: 'dropdown__menu-label',
        }, gettextCatalog.getString(props.label),
        props.label === 'Actions' ? React.createElement(
            'button',
            {className: 'dropdown__menu-close', onClick: () => {
                closeActionsMenu(props.item._id);
            }},
            React.createElement(
                'i',
                {className: 'icon-close-small'}
            )
        ) : null
        )
    );
};

Label.propTypes = {
    svc: PropTypes.object.isRequired,
    label: PropTypes.any,
    item: PropTypes.object,
};
