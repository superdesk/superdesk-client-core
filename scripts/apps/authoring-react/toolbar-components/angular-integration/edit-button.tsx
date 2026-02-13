import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

export const EditButtonComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        type="primary"
        onClick={() => sdApi.article.edit({_id: entity._id, _type: entity._type, state: entity.state})}
        text={gettext('Edit')}
        style="filled"
    />
);
