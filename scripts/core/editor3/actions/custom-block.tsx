import {RawDraftContentState} from 'draft-js';

export const addCustomBlock = (initialContent: RawDraftContentState) => ({type: 'TOOLBAR_ADD_CUSTOM_BLOCK', payload: {initialContent}});
