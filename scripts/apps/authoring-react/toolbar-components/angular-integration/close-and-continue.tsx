import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import ng from 'core/services/ng';
import {inlineToolbarContext} from './inline-toolbar-context';

export const CloseAndContinueComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        type="highlight"
        onClick={() => {
            const getLatestArticle = inlineToolbarContext.exposed?.hasUnsavedChanges()
                ? inlineToolbarContext.exposed?.handleUnsavedChanges()
                : Promise.resolve(entity);

            getLatestArticle.then((article) => {
                ng.get('authoring').close().then(() => {
                    sdApi.article.rewrite(article);
                });
            });
        }}
        text={gettext('C & C')}
        style="filled"
    />
);
