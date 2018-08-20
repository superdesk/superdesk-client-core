import React from 'react';
import PropTypes from 'prop-types';

export const ModalBody:React.StatelessComponent<any> = (props) => (
    <div className="modal__body">
        {props.children}
    </div>
);

ModalBody.propTypes = {
    children: PropTypes.any.isRequired,
};