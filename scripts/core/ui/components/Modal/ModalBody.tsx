/* eslint-disable react/prop-types */

import React from 'react';

export const ModalBody: React.StatelessComponent = (props) => (
    <div className="modal__body">
        {props.children}
    </div>
);
