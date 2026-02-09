import React from 'react';
import {IArticle} from 'superdesk-api';
import {ToggleFullWidth} from 'apps/authoring/authoring/components/toggleFullWithEditor';
import {useInlineToolbarContext} from './inline-toolbar-context';

export const ToggleFullWidthComponent: React.ComponentType<{entity: IArticle}> = () => {
    const {exposed, setFullWidth, fullWidth} = useInlineToolbarContext<IArticle>();

    return (
        <ToggleFullWidth
            setFullWidth={() => {
                exposed?.authoringStorage.autosave.flush().then(() => {
                    setFullWidth?.();
                });
            }}
            fullWidth={fullWidth}
        />
    );
};
