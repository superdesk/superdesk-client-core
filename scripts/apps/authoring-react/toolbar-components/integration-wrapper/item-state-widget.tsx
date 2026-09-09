import React from 'react';
import {IArticle} from 'superdesk-api';
import {StatusInfo} from 'apps/search/components/fields/state';

export const ItemStateWidget: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    if (entity.state == null) {
        return null;
    }

    return (
        <span data-test-id="authoring-item-state">
            <StatusInfo item={entity} clickable={false} />
        </span>
    );
};
