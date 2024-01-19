import {IDesk} from 'superdesk-api';

export const testDesk: IDesk = {
    _id: 'test-desk',
    _updated: '2019-12-06T17:55:49+0000',
    _created: '2019-12-06T17:55:49+0000',
    _etag: '5521a2155660fa3708d1fd4a61f3c9cb18a0d582',
    _links: {},

    name: 'Test desk',
    members: [],
    incoming_stage: 'stage-1',
    working_stage: 'stage-2',
    source: 'test-desk-source',
    desk_type: 'authoring',
    content_profiles: {},
    default_content_profile: 'test-desk-profile',
    default_content_template: 'test-desk-template',
    preferred_cv_items: {},
    preserve_published_content: false,
    send_to_desk_not_allowed: false,
};
