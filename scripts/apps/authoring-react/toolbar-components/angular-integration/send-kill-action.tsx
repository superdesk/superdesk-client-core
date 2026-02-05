import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {inlineToolbarContext} from './inline-toolbar-context';

export const SendKillActionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        text={gettext('Send kill')}
        style="filled"
        type="primary"
        onClick={() => {
            inlineToolbarContext.exposed?.handleUnsavedChanges()
                .then(() => sdApi.article.publishItem(
                    inlineToolbarContext.exposed?.item,
                    entity,
                    'kill',
                ))
                .then(() => inlineToolbarContext.exposed?.initiateClosing());
        }}
    />
);
