import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';

export const update: React.StatelessComponent<any> = (props) => {
    if (props.item.correction_sequence) {
        return React.createElement(
            'div',
            {
                className: 'provider',
                key: 'update',
                title: gettext('correction sequence'),
            },
            gettext('Update {{sequence}}', {sequence: props.item.correction_sequence}),
        );
    }
};

update.propTypes = {
    item: PropTypes.any,
};
