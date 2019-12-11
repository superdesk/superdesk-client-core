import * as React from 'react';
import {ISuperdesk} from 'superdesk-api';

// Cast type to avoid creating an instance of ISuperdesk as we don't need default context value
const VideoEditorContext = React.createContext<ISuperdesk>({} as ISuperdesk);

export const VideoEditorProvider = VideoEditorContext.Provider;
export const VideoEditorConsumer = VideoEditorContext.Consumer;
export default VideoEditorContext;
