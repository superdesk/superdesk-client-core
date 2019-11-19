import * as React from 'react';
import {IDropdownLabel} from '../interfaces';

function Label(props: IDropdownLabel) {
    return (
        <button
            className={`
                dropdown__toggle btn btn--ui-dark btn--hollow btn--icon-only btn--large
                ${props.selectedItem ? 'btn--sd-green' : ''}
            `}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            <i className="icon-crop" />
        </button>
    );
}
export const CropLabel = React.memo(Label);
