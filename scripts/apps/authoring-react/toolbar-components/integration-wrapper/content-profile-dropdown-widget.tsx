import React from 'react';
import {IArticle} from 'superdesk-api';
import {ContentProfileDropdown} from '../../subcomponents/content-profile-dropdown';
import {useToolbarContext} from './toolbar-context';

export const ContentProfileDropdownWidget: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed, authoringStorage} = useToolbarContext();

    return (
        <div className="authoring-header__general-info">
            <ContentProfileDropdown
                item={entity}
                reinitialize={(item) => {
                    if (exposed == null || authoringStorage == null) {
                        return;
                    }

                    const handledChanges = exposed.hasUnsavedChanges()
                        ? exposed.handleUnsavedChanges()
                        : Promise.resolve();

                    handledChanges.then(() => {
                        authoringStorage.getContentProfile(
                            item,
                            exposed?.fieldsAdapter,
                        ).then((profile) => {
                            exposed?.reinitialize(item, profile);
                        });
                    });
                }}
            />
        </div>
    );
};
