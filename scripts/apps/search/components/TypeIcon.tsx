import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';

interface IProps {
    type: any;
    highlight?: any;
}

/**
 * Type icon component
 */
export const TypeIcon: React.StatelessComponent<IProps> = (props) => {
    if (props.type === 'composite' && props.highlight) {
        return React.createElement('i', {className: 'filetype-icon-highlight-pack'});
    }

    return React.createElement('i', {
        className: 'filetype-icon-' + props.type,
        title: gettext('Article Type: {{type}}', {type: props.type}),
    });
};

TypeIcon.propTypes = {
    type: PropTypes.any,
    highlight: PropTypes.any,
};
