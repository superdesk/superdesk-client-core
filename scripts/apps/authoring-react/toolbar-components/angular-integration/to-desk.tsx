import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {inlineToolbarContext} from './inline-toolbar-context';

export const ToDeskComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        tooltip={gettext('To Desk')}
        text={gettext('T D')}
        style="filled"
        onClick={() => {
            inlineToolbarContext.exposed?.handleUnsavedChanges()
                .then(() => sdApi.article.sendItemToNextStage(entity))
                .then(() => inlineToolbarContext.exposed?.initiateClosing());
        }}
    />
);
