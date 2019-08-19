import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';
import {IPropsItemListInfo} from '../ListItemInfo';

export const takekey: React.StatelessComponent<IPropsItemListInfo> = (props) => {
    if (props.item.anpa_take_key) {
        return React.createElement('span', {className: 'takekey', key: 'takekey'},
            gettext(props.item.anpa_take_key));
    } else {
        return null;
    }
};

takekey.propTypes = {
    item: PropTypes.any,
};
