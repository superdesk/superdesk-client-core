import * as React from 'react';

const VideoEditorContext = React.createContext({});

export const VideoEditorProvider = VideoEditorContext.Provider;
export const VideoEditorConsumer = VideoEditorContext.Consumer;
export default VideoEditorContext;
