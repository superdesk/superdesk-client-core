import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/ui/components/utils';

/**
 * Type icon component
 */
export const TypeIcon: React.StatelessComponent<any> = (props) => {
    if (props.type === 'composite' && props.highlight) {
        return React.createElement('i', {className: 'filetype-icon-highlight-pack'});
    }

    return React.createElement('i', {
        className: 'filetype-icon-' + props.type,
        title: `${gettext('Article Type')}: ${props.type}`,
    });
};

TypeIcon.propTypes = {
    type: PropTypes.any,
    highlight: PropTypes.any,
};
