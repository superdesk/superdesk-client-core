import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';
import {IContentProfile} from 'superdesk-api';
import {WithRelatedEntity} from 'core/withRelatedEntity';

class ProfileComponent extends React.Component<IPropsItemListInfo> {
    public static relatedEntities = [
        {pathToId: 'profile', collection: 'content_types'},
    ];

    render() {
        const {relatedEntities, item} = this.props;

        return (
            <WithRelatedEntity entities={relatedEntities} collection="content_types" entityId={item.profile}>
                {(contentProfile: IContentProfile) => (
                    <div className="profile-label">
                        {contentProfile.label}
                    </div>
                )}
            </WithRelatedEntity>
        );
    }
}

export const profile = ProfileComponent;
