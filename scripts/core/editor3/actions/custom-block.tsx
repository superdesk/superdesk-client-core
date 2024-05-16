import {RawDraftContentState} from 'draft-js';

export const addCustomBlock = (initialContent: RawDraftContentState, vocabularyId: string) =>
    ({type: 'TOOLBAR_ADD_CUSTOM_BLOCK', payload: {initialContent, vocabularyId}});
