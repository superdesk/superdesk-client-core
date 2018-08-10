import React from 'react';
import PropTypes from 'prop-types';

/**
 * Type icon component
 */
export const TypeIcon:React.StatelessComponent<any> = (props) => {
    const {gettextCatalog} = props.svc;

    if (props.type === 'composite' && props.highlight) {
        return React.createElement('i', {className: 'filetype-icon-highlight-pack'});
    }

    return React.createElement('i', {
        className: 'filetype-icon-' + props.type,
        title: `${gettextCatalog.getString('Article Type')}: ${props.type}`,
    });
}

TypeIcon.propTypes = {
    svc: PropTypes.object.isRequired,
    type: PropTypes.any,
    highlight: PropTypes.any,
};
