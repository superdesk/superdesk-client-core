import React from 'react';
import {IArticle} from 'superdesk-api';
import {ContentProfileDropdown} from '../../subcomponents/content-profile-dropdown';
import {useToolbarContext} from './toolbar-context';

export const ContentProfileDropdownWidget: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed, authoringStorage} = useToolbarContext<IArticle>();

    return (
        <div className="authoring-header__general-info">
            <ContentProfileDropdown
                item={entity}
                reinitialize={(itemWithNewProfile) => {
                    if (exposed == null || authoringStorage == null) {
                        return;
                    }

                    // Match legacy: switch with no "save changes?" prompt. Rebuild from the latest
                    // in-memory item (getLatestItem, not the entity prop which can be stale) so unsaved
                    // edits survive the switch; the normal autosave then persists it.
                    const updatedItem: IArticle = {
                        ...exposed.getLatestItem(),
                        profile: itemWithNewProfile.profile,
                    };

                    authoringStorage.getContentProfile(
                        updatedItem,
                        exposed.fieldsAdapter,
                    ).then((profile) => {
                        exposed.reinitialize(updatedItem, profile);
                    });
                }}
            />
        </div>
    );
};
