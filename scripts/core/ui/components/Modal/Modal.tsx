import React from 'react';
import PropTypes from 'prop-types';

export const Modal: React.StatelessComponent = (props) => (
    <div>
        {props.children}
    </div>
);

Modal.propTypes = {
    children: PropTypes.any.isRequired,
};
