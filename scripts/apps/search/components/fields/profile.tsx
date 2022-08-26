import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';
import {IContentProfile, IArticle} from 'superdesk-api';
import {IRelatedEntitiesToFetch} from '.';

const endpoint = '/content_types';

class ProfileComponent extends React.Component<IPropsItemListInfo> {
    public static getRelatedEntities(item: IArticle): IRelatedEntitiesToFetch {
        if (item.profile == null) {
            return [];
        } else {
            return [
                {endpoint: endpoint, id: item.profile},
            ];
        }
    }

    render() {
        const {relatedEntities, item} = this.props;

        if (item.profile == null) {
            return null;
        }

        const contentProfile: IContentProfile = relatedEntities[endpoint].get(item.profile);

        if (contentProfile == null || contentProfile.label == null) {
            return null;
        }

        return (
            <div className="profile-label">
                {contentProfile.label}
            </div>
        );
    }
}

export const profile = ProfileComponent;
