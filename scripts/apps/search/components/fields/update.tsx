import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

export const update: React.StatelessComponent<IPropsItemListInfo> = (props) => {
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
    } else {
        return null;
    }
};

update.propTypes = {
    item: PropTypes.any,
};
