import React from 'react';
import {AvatarWrapper, AvatarContentImage} from 'superdesk-ui-framework';

interface IProps {
    size: 'small' | 'medium' | 'large';
}

export class UserOrganisationAvatar extends React.PureComponent<IProps> {
    render() {
        return (
            <AvatarWrapper
                size={this.props.size}
            >
                <AvatarContentImage
                    imageUrl="/images/avatar_group_64_green_bg.png"
                />
            </AvatarWrapper>
        );
    }
}
