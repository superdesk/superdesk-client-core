/* eslint-disable react/prop-types */

import React from 'react';
import {IPropsModalHeader} from 'superdesk-api';

export const ModalHeader: React.StatelessComponent<IPropsModalHeader> = (props) => (
    <div className="modal__header">
        {props.onClose &&
            <button className="modal__close pull-right" onClick={props.onClose}>
                <i className="icon-close-small" />
            </button>
        }
        <h3 className="modal__heading">{props.children}</h3>
    </div>
);
