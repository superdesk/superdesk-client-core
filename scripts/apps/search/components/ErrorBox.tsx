import React from 'react';
import PropTypes from 'prop-types';

export const ErrorBox: React.StatelessComponent<any> = (props) => {
    const {gettextCatalog} = props.svc;

    return React.createElement('div', {className: 'error-box'},
        React.createElement('p', {className: 'message'},
            gettextCatalog.getString('There was an error archiving this item')),
        React.createElement('div', {className: 'buttons'}),
    );
};

ErrorBox.propTypes = {
    svc: PropTypes.object.isRequired,
};
