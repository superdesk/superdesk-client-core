import React from 'react';
import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';
import {LockInfo} from '../../subcomponents/lock-info';
import {inlineToolbarContext} from './inline-toolbar-context';

export const LockInfoComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <LockInfo
        article={entity}
        unlock={() => inlineToolbarContext.exposed?.stealLock()}
        isLockedInOtherSession={(article) => sdApi.article.isLockedInOtherSession(article)}
    />
);
