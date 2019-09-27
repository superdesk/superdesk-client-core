import * as React from 'react';

interface IProps {
    onClick?: () => void;
    select?: string | number | null;
    disabled?: boolean;
}

export function QualityLabel(props: IProps) {
    return <p onClick={props.onClick}>Quality: {props.select || 'Same'}</p>;
}
