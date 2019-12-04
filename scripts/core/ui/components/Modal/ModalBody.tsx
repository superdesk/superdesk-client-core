import React from 'react';

export const ModalBody: React.StatelessComponent = (props) => (
    <div className="modal__body" data-test-id="modal-body">
        {props.children}
    </div>
);
