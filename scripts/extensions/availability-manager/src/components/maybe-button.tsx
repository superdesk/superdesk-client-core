import * as React from 'react';

interface IProps {
    onClick: (() => void) | undefined;
    children: React.ReactElement;
}

export function MaybeButton(props: IProps): React.ReactElement {
    if (props.onClick == null) {
        return props.children;
    }

    return (
        <button
            onClick={props.onClick}
            style={{
                padding: 0,
                cursor: 'pointer',
            }}
        >
            {props.children}
        </button>
    );
}