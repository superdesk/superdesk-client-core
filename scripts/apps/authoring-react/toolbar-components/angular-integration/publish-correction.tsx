import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const PublishCorrectionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            text={gettext('PUBLISH')}
            style="filled"
            type="primary"
            onClick={() => {
                exposed?.handleUnsavedChanges()
                    .then(() => sdApi.article.publishItem(
                        entity,
                        exposed?.getLatestItem(),
                        'publish',
                    ))
                    .then(() => exposed?.initiateClosing());
            }}
        />
    );
};
