import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const ToDeskComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            tooltip={gettext('To Desk')}
            text={gettext('T D')}
            style="filled"
            onClick={() => {
                exposed?.handleUnsavedChanges()
                    .then(() => sdApi.article.sendItemToNextStage(entity))
                    .then(() => exposed?.initiateClosing());
            }}
        />
    );
};
