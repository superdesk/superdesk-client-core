import * as React from 'react';
import { IDropdownLabel } from '../interfaces';

function Label(props: IDropdownLabel) {
    const value = String(props.selectedItem || 'Same');
    return (
        <button
            className="dropdown__toggle dark-ui dropdown-toggle"
            aria-haspopup="true"
            aria-expanded="false"
            onClick={props.onClick}
            sd-tooltip={props.title}
        >
            {props.getText!(value)}
            <span className="dropdown__caret dropdown__caret--white"></span>
        </button>
    );
}

export const QualityLabel = React.memo(Label);
