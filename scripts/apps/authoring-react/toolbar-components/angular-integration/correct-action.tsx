import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

export const CorrectActionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        tooltip={gettext('Correct')}
        text={gettext('C')}
        style="filled"
        type="primary"
        onClick={() => {
            if (appConfig?.corrections_workflow) {
                ng.get('authoring').correction(entity);
            } else {
                ng.get('authoringWorkspace').authoringOpen(entity._id, 'correct');
            }
        }}
    />
);
