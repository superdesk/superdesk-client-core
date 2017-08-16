import React from 'react';

/**
 * Type role label component
 */
export function RoleLabel(props) {
    const {gettextCatalog} = props.svc;

    return React.createElement('i', {
        className: '',
        title: `${gettextCatalog.getString('Role')}: ${props.role}`
    });
}

RoleLabel.propTypes = {
    svc: React.PropTypes.object.isRequired,
    role: React.PropTypes.any
};
