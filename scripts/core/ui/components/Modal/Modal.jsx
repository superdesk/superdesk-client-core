import React from 'react';
import PropTypes from 'prop-types';

export const Modal = (props) => (
    <div>
        {props.children}
    </div>
);

Modal.propTypes = {
    children: PropTypes.any.isRequired,
};