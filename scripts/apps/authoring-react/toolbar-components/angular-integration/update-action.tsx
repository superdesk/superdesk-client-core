import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

export const UpdateActionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        text="U"
        tooltip={gettext('UPDATE')}
        style="filled"
        type="primary"
        onClick={() => sdApi.article.rewrite(entity)}
    />
);
