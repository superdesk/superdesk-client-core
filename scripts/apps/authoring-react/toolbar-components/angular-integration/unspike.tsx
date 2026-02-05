import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

export const UnspikeComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        text={gettext('UNSPIKE')}
        style="filled"
        type="primary"
        onClick={() => sdApi.article.doUnspike(entity, entity.task.desk, entity.task.stage)}
    />
);
