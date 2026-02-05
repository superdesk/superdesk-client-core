import React from 'react';
import {IArticle} from 'superdesk-api';
import {DeskAndStage} from '../../subcomponents/desk-and-stage';

export const DeskAndStageComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <DeskAndStage article={entity} />
);
