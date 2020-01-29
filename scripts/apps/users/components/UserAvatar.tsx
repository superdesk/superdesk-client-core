import React from 'react';

interface IProps {
    displayName: string;
    title?: string;
    pictureUrl?: string;
}

export class UserAvatar extends React.PureComponent<IProps> {
    render() {
        const {displayName, pictureUrl, title} = this.props;

        return (
            <div
                className="user-avatar"
                title={title || displayName}
                data-test-id="user-avatar"
            >
                <figure
                    className={[
                        'avatar',
                        'avatar--no-margin',
                        pictureUrl ? 'no-bg' : 'initials',
                    ].join(' ')}
                >
                    {pictureUrl && <img src={pictureUrl} />}
                    {displayName && <span>{displayName[0].toUpperCase()}</span>}
                </figure>
            </div>
        );
    }
}
