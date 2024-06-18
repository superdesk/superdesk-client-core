import React from 'react';
import postscribe from 'postscribe';

interface IProps {
    embedHtml: string;
}

export class EmbedPreview extends React.PureComponent<IProps> {
    private container: HTMLDivElement;

    componentDidMount() {
        postscribe(this.container, this.props.embedHtml);
    }

    render() {
        return (
            <div
                ref={(el) => {
                    this.container = el;
                }}
            />
        );
    }
}
