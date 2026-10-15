import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const SendTakedownActionComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            data-test-id="send-takedown"
            text={gettext('Send takedown')}
            style="filled"
            type="primary"
            onClick={() => {
                /**
                 * Takes the edited notice straight from the editor rather than going through
                 * `handleUnsavedChanges`, whose Save option would hang: takedown storage
                 * implements `saveEntity` as a promise that never resolves (`data-layer.ts`).
                 */
                sdApi.article.publishItem(entity, exposed?.getLatestItem(), 'takedown')
                    .then(() => exposed?.initiateClosing());
            }}
        />
    );
};
