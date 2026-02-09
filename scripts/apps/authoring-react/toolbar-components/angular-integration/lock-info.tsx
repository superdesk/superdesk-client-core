import React from 'react';
import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';
import {LockInfo} from '../../subcomponents/lock-info';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const LockInfoComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <LockInfo
            article={entity}
            unlock={() => exposed?.stealLock()}
            isLockedInOtherSession={(article) => sdApi.article.isLockedInOtherSession(article)}
        />
    );
};
