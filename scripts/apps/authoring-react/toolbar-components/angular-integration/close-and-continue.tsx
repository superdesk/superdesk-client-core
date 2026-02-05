import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import ng from 'core/services/ng';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const CloseAndContinueComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            type="highlight"
            onClick={() => {
                const getLatestArticle = exposed?.hasUnsavedChanges()
                    ? exposed?.handleUnsavedChanges()
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
};
