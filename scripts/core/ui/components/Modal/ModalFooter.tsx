import * as React from 'react';
import classNames from 'classnames';
import {IModalFooterProps} from 'superdesk-api';

export const ModalFooter: React.FC<IModalFooterProps> = (props) => (
    <div
        className={classNames(
            'modal__footer',
            {'sd-d-flex': props.flex},
        )}
        data-test-id="modal-footer"
    >
        {props.children}
    </div>
);
