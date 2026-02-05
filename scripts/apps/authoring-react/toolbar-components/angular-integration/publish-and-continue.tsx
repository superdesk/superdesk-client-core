import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import ng from 'core/services/ng';
import {notify} from 'core/notify/notify';
import {inlineToolbarContext} from './inline-toolbar-context';

export const PublishAndContinueComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => (
    <Button
        type="highlight"
        onClick={() => {
            const getLatestArticle = inlineToolbarContext.exposed?.hasUnsavedChanges()
                ? inlineToolbarContext.exposed?.handleUnsavedChanges()
                : Promise.resolve(entity);

            getLatestArticle.then((article) => {
                sdApi.article.publishItem(article, article).then((result) => {
                    typeof result !== 'boolean'
                        ? ng.get('authoring').rewrite(result)
                        : notify.error(gettext('Failed to publish and continue.'));
                });
            });
        }}
        text={gettext('P & C')}
        style="filled"
    />
);
