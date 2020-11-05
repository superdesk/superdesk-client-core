import React from 'react';

interface IProps {
    embed: string;
    description: string;
}

export class EmbedPreview extends React.Component<IProps> {
    render() {
        const {embed, description} = this.props;

        return (
            <div>
                {description == null ? null : (
                    <div>{description}</div>
                )}
                <div dangerouslySetInnerHTML={{__html: embed}} />
            </div>
        );
    }
}
