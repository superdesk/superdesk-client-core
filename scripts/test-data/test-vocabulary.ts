import {IVocabulary} from 'superdesk-api';

export const testVocabulary: IVocabulary = {
    _id: 'vocabulary_id',
    field_type: 'custom',
    items: [],
    type: 'manageable',
    schema: {
        name: {},
        qcode: {},
        parent: {},
    },
    service: {
        all: 1,
    },
    display_name: 'Test display name',
    _updated: '2019-11-21T21:49:16+0000',
    _created: '2019-11-13T18:11:38+0000',
    _deleted: false,
    unique_field: 'qcode',
    _etag: '4209dd27c084bb5091748f335d058d8afa14c32d',
    _links: {
        self: {
            title: 'Vocabularie',
            href: 'vocabularies/vocabulary_id',
        },
    },
};
