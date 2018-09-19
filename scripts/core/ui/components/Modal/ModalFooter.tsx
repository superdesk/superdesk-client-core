import React from 'react';
import PropTypes from 'prop-types';

export const ModalFooter: React.StatelessComponent<any> = (props) => (
    <div className="modal__footer">
        {props.children}
    </div>
);

ModalFooter.propTypes = {
    children: PropTypes.any.isRequired,
};
