import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';
import ng from 'core/services/ng';

export const expiry: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    const datetime = ng.get('datetime');

    if (props.item.is_spiked) {
        return React.createElement(
            'div',
            {className: 'expires', key: 'expiry'},
            gettext('expires') + ' ' + datetime.shortFormat(props.item.expiry),
        );
    } else {
        return null;
    }
};

expiry.propTypes = {
    item: PropTypes.any,
};
