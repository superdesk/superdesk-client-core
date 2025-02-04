import React from 'react';
import postscribe from 'postscribe';

interface IProps {
    embed: string;
    description: string;
}

export class EmbedPreview extends React.Component<IProps> {
    el: HTMLDivElement;

    componentDidMount() {
        postscribe(this.el, this.props.embed);
    }

    render() {
        const {description} = this.props;

        return (
            <div>
                {
                    description != null && <div>{description}</div>
                }

                <div
                    ref={(el) => {
                        this.el = el;
                    }}
                />
            </div>
        );
    }
}
