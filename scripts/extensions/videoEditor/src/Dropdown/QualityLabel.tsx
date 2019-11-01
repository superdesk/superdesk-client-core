import * as React from 'react';

interface IProps {
    onClick?: () => void;
    getText?: (text: string) => string;
    select?: string | number | null;
    disabled?: boolean;
}
export function QualityLabel(props: IProps) {
    return (
        <p onClick={props.onClick}>
            {props.getText!('Quality')}: {props.getText!(String(props.select || 'Same'))}
        </p>
    );
}
