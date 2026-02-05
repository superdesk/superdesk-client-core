import React from 'react';
import {IArticle} from 'superdesk-api';
import {ToggleFullWidth} from 'apps/authoring/authoring/components/toggleFullWithEditor';
import {inlineToolbarContext} from './inline-toolbar-context';

export const ToggleFullWidthComponent: React.ComponentType<{entity: IArticle}> = () => (
    <ToggleFullWidth
        setFullWidth={() => {
            inlineToolbarContext.exposed?.authoringStorage.autosave.flush().then(() => {
                inlineToolbarContext.setFullWidth?.();
            });
        }}
        fullWidth={inlineToolbarContext.fullWidth}
    />
);
