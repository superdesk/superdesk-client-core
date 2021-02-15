import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';
import {IContentProfile, IArticle} from 'superdesk-api';
import {IRelatedEntitiesToFetch} from '.';

class ProfileComponent extends React.Component<IPropsItemListInfo> {
    public static getRelatedEntities(item: IArticle): IRelatedEntitiesToFetch {
        if (item.profile == null) {
            return [];
        } else {
            return [
                {collection: 'content_types', id: item.profile},
            ];
        }
    }

    render() {
        const {relatedEntities, item} = this.props;
        const contentProfile: IContentProfile = relatedEntities['content_types'].get(item.profile);

        return (
            <div className="profile-label">
                {contentProfile.label}
            </div>
        );
    }
}

export const profile = ProfileComponent;
