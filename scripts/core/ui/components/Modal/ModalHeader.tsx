import * as React from 'react';
import classNames from 'classnames';

import {IPropsModalHeader} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IconButton} from 'superdesk-ui-framework/react';

export const ModalHeader: React.FC<IPropsModalHeader> = (props) => (
    <div
        data-test-id="modal-header"
        className={classNames(
            'modal__header',
            {'modal__header--flex': props.onClose != null},
        )}
    >
        <h3 className="modal__heading">
            {props.children}
        </h3>
        {!props.onClose ? null : (
            <IconButton
                ariaValue={gettext('Close')}
                icon="close-small"
                onClick={() => props.onClose()}
                toolTipFlow="left"
                toolTipAppend={true}
            />
        )}
    </div>
);
