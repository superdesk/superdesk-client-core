import React from 'react';

interface IProps {
    value: string;
}

export class PlainTextPreview extends React.Component<IProps> {
    render() {
        return (
            <div>{this.props.value}</div>
        );
    }
}
