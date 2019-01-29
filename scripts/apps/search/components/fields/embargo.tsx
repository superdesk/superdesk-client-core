import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/ui/components/utils';

export const embargo: React.StatelessComponent<any> = (props) => {
    if (props.item.embargo) {
        return React.createElement(
            'span',
            {className: 'state-label state_embargo', title: gettext('embargo'), key: 'embargo'},
            gettext('embargo'),
        );
    }
};

embargo.propTypes = {
    item: PropTypes.any,
};
