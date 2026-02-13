import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

export const TakedownActionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        text="T"
        tooltip={gettext('Takedown')}
        style="filled"
        type="primary"
        onClick={() => {
            ng.get('authoringWorkspace').authoringOpen(entity._id, 'takedown');
        }}
    />
);
