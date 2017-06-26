import React from 'react';

/**
 * Type icon component
 */
export function TypeIcon(props) {
    const {gettextCatalog} = props.svc;

    if (props.type === 'composite' && props.highlight) {
        return React.createElement('i', {className: 'filetype-icon-highlight-pack'});
    }

    return React.createElement('i', {
        className: 'filetype-icon-' + props.type,
        title: `${gettextCatalog.getString('Article Type')}: ${props.type}`
    });
}

TypeIcon.propTypes = {
    svc: React.PropTypes.object.isRequired,
    type: React.PropTypes.any,
    highlight: React.PropTypes.any,
};
