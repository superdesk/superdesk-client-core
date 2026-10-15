import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const SendKillActionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            data-test-id="send-kill"
            text={gettext('Send kill')}
            style="filled"
            type="primary"
            onClick={() => {
                exposed?.handleUnsavedChanges()
                    .then(() => sdApi.article.publishItem(
                        exposed?.item,
                        entity,
                        'kill',
                    ))
                    .then(() => exposed?.initiateClosing());
            }}
        />
    );
};
