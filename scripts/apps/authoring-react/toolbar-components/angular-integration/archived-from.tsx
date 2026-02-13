import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {DeskAndStage} from '../../subcomponents/desk-and-stage';

export const ArchivedFromComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <span>
        <b>{gettext('Archived from')}</b>
        <DeskAndStage article={entity} />
    </span>
);
