import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {getSendAndDuplicateTarget} from 'apps/authoring/authoring/get-send-and-duplicate-target';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const SendAndDuplicateComponent: React.ComponentType<{entity: IArticle}> = ({entity}) => {
    const {exposed} = useInlineToolbarContext<IArticle>();

    return (
        <Button
            tooltip={gettext('Send and duplicate')}
            ariaLabel={gettext('Send and duplicate')}
            text={gettext('S & D')}
            style="filled"
            onClick={() => {
                exposed?.handleUnsavedChanges()
                    .then(() => {
                        const {deskId, stageId} = getSendAndDuplicateTarget();

                        sdApi.article.duplicateItems(
                            [entity._id],
                            {
                                type: 'desk',
                                desk: deskId,
                                stage: stageId,
                            },
                        );
                    })
                    .catch(() => {
                        // noop - user cancelled the operation
                    });
            }}
        />
    );
};
