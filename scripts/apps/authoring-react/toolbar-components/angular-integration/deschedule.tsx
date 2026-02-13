import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

export const DescheduleComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        text={gettext('Deschedule')}
        style="filled"
        type="primary"
        onClick={() => sdApi.article.deschedule(entity)}
    />
);
