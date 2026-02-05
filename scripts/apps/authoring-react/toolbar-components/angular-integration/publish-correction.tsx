import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {inlineToolbarContext} from './inline-toolbar-context';

export const PublishCorrectionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        text={gettext('PUBLISH')}
        style="filled"
        type="primary"
        onClick={() => {
            inlineToolbarContext.exposed?.handleUnsavedChanges()
                .then(() => sdApi.article.publishItem(
                    entity,
                    inlineToolbarContext.exposed?.getLatestItem(),
                    'publish',
                ))
                .then(() => inlineToolbarContext.exposed?.initiateClosing());
        }}
    />
);
