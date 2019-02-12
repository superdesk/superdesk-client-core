import React from 'react';
import PropTypes from 'prop-types';

export const ModalHeader: React.StatelessComponent<any> = (props) => (
    <div className="modal__header">
        {props.onClose &&
            <button className="modal__close pull-right" onClick={props.onClose}>
                <i className="icon-close-small" />
            </button>
        }
        <h3 className="modal__heading">{props.children}</h3>
    </div>
);

ModalHeader.propTypes = {
    children: PropTypes.any.isRequired,
    onClose: PropTypes.func,
};
