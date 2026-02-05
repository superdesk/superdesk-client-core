import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {inlineToolbarContext} from './inline-toolbar-context';

export const SendCorrectionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        text={gettext('Send Correction')}
        style="filled"
        type="primary"
        onClick={() => {
            sdApi.article.publishItem(entity, inlineToolbarContext.exposed?.getLatestItem(), 'correct').then(() => {
                inlineToolbarContext.exposed?.initiateClosing();
            });
        }}
    />
);
