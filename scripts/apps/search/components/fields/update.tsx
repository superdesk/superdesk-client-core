import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/ui/components/utils';

export const update: React.StatelessComponent<any> = (props) => {
    if (props.item.correction_sequence) {
        return React.createElement(
            'div',
            {
                className: 'provider',
                key: 'update',
                title: gettext('correction sequence'),
            },
            gettext('Update {{seq}}', {seq: props.item.correction_sequence}),
        );
    }
};

update.propTypes = {
    item: PropTypes.any,
};
