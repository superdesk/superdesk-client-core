import {RawDraftContentState} from 'draft-js';

export const addCustomBlock = (initialContent: RawDraftContentState, vocabularyId: string, label: string) =>
    ({type: 'TOOLBAR_ADD_CUSTOM_BLOCK', payload: {initialContent, vocabularyId, label}});
