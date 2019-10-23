import React from 'react';

export const ModalFooter: React.StatelessComponent = (props) => (
    <div className="modal__footer" data-test-id="modal-footer">
        {props.children}
    </div>
);
