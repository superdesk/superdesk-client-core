import * as React from 'react';
import { IDropdownLabel } from '../interfaces';

export function CropLabel(props: IDropdownLabel) {
    return (
        <button
            className={`
                dropdown__toggle btn btn--ui-dark btn--icon-only btn-hollow
                ${props.selectedItem ? 'btn--sd-green' : ''}
            `}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            <i className="icon-crop"></i>
        </button>
    );
}
