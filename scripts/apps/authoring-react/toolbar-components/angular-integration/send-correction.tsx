import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const SendCorrectionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            text={gettext('Send Correction')}
            style="filled"
            type="primary"
            onClick={() => {
                sdApi.article.publishItem(entity, exposed?.getLatestItem(), 'correct').then(() => {
                    exposed?.initiateClosing();
                });
            }}
        />
    );
};
