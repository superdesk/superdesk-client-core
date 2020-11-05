import React from 'react';

interface IProps {
    value: string;
}

export class HtmlPreview extends React.Component<IProps> {
    render() {
        return (
            <div dangerouslySetInnerHTML={{__html: this.props.value}} />
        );
    }
}
