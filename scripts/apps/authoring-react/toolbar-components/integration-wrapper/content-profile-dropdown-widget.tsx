import React from 'react';
import {IArticle} from 'superdesk-api';
import {ContentProfileDropdown} from '../../subcomponents/content-profile-dropdown';
import {exposedRef, authoringStorageRef} from './toolbar-context';

export const ContentProfileDropdownWidget: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <div className="authoring-header__general-info">
        <ContentProfileDropdown
            item={entity}
            reinitialize={(item) => {
                if (exposedRef == null || authoringStorageRef == null) {
                    return;
                }

                const handledChanges = exposedRef.hasUnsavedChanges()
                    ? exposedRef.handleUnsavedChanges()
                    : Promise.resolve();

                handledChanges.then(() => {
                    authoringStorageRef.getContentProfile(
                        item,
                        exposedRef.fieldsAdapter,
                    ).then((profile) => {
                        exposedRef?.reinitialize(item, profile);
                    });
                });
            }}
        />
    </div>
);
