import React from 'react';
import PropTypes from 'prop-types';
import {closeActionsMenu} from '../../helpers';
import {gettext} from 'core/ui/components/utils';

const Label: React.StatelessComponent<any> = (props) =>
    React.createElement(
        'li',
        null,
        React.createElement('div', {
            className: 'dropdown__menu-label',
        }, gettext(props.label),
        props.label === 'Actions' ? React.createElement(
            'button',
            {className: 'dropdown__menu-close', onClick: () => {
                closeActionsMenu(props.item._id);
            }},
            React.createElement(
                'i',
                {className: 'icon-close-small'},
            ),
        ) : null,
        ),
    );

Label.propTypes = {
    label: PropTypes.any,
    item: PropTypes.object,
};

export default Label;
