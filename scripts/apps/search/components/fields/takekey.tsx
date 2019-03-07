import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';

export const takekey: React.StatelessComponent<any> = (props) => {
    if (props.item.anpa_take_key) {
        return React.createElement('span', {className: 'takekey', key: 'takekey'},
            gettext(props.item.anpa_take_key));
    }
};

takekey.propTypes = {
    item: PropTypes.any,
};
