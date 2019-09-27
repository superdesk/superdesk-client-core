import * as React from 'react';

interface ICropIcon {
    onClick?: () => void;
    select?: string | number | null;
    disabled: boolean;
}
export function CropIcon(props: ICropIcon) {
    return (
        <button
            className={`
                dropdown__toggle btn btn--ui-dark btn--icon-only btn-hollow
                ${props.select ? 'btn--sd-green' : ''}
            `}
            onClick={props.onClick}
            disabled={props.disabled}
        >
            <i className="icon-crop"></i>
        </button>
    );
}
