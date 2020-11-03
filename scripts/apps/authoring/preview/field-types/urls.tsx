import React from 'react';

interface IProps {
    urls: Array<{url: string; description: string}>;
}

export class UrlsPreview extends React.Component<IProps> {
    render() {
        return (
            <div>
                {
                    this.props.urls.map(({url, description}) => (
                        <div key={url}>
                            <a href={url}>{description}</a> ({url})
                        </div>
                    ))
                }
            </div>
        );
    }
}
