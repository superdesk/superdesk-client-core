import {ISubject, IArticle, IRelatedArticle, IVocabulary, IAttachment} from 'superdesk-api';

export type IAuthoringField =
    {
        type: 'plain-text';
        id: string;
        value: string;
    }
    | {
        type: 'html';
        id: string;
        value: string;
    }
    | {
        type: 'subjects';
        id: string;
        value: Array<{name: string; qcode: string}>;
    }
    | {
        type: 'vocabulary-values';
        id: string;
        value: {
            vocabularyId: string;
            qcodes: Array<string>;
        };
    }
    | {
        type: 'urls';
        id: string;
        value: Array<{url: string; description: string}>;
    }
    | {
        type: 'media-gallery';
        id: string;
        value: Array<IArticle>;
    }
    | {
        type: 'related-articles';
        id: string;
        value: Array<IRelatedArticle>;
    }
    | {
        type: 'embed';
        id: string;
        value: {embed: string; description: string};
    }
    | {
        type: 'attachments';
        id: string;
        value: Array<{attachment: IAttachment['_id']}>;
    }
    | {
        type: 'custom';
        id: string;
        value: {item: IArticle; field: IVocabulary};
    }
;
