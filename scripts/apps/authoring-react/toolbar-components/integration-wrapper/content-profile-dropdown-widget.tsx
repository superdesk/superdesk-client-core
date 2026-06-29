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

                    // Mirror legacy changeProfile: no "save changes?" prompt. Rebuild from the latest
                    // in-memory item so unsaved edits are preserved (not the `entity` prop, which lags
                    // one edit behind), then let the normal autosave persist the switch.
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
