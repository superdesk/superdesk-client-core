import * as React from 'react';
import { IDropdownLabel } from '../interfaces';

function Label(props: IDropdownLabel) {
    const value = String(props.selectedItem || 'Same');
    return (
        <p onClick={props.onClick} sd-tooltip={props.title}>
            {props.getText!('Quality')}: {props.getText!(value)}
        </p>
    );
}

export const QualityLabel = React.memo(Label);
