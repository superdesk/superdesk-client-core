import React from 'react';
import PropTypes from 'prop-types';

export const ModalHeader = (props) => (
    <div className="modal__header">
        <h3>{props.children}</h3>
    </div>
);

ModalHeader.propTypes = {
    children: PropTypes.any.isRequired,
};