import React from 'react';
import {IArticle} from 'superdesk-api';
import {CreatedModifiedInfo} from '../../subcomponents/created-modified-info';

export const CreatedModifiedInfoWidget: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <CreatedModifiedInfo article={entity} />
);
