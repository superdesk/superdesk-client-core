import {IArticle} from 'superdesk-api';
import {ITEM_STATE} from 'apps/archive/constants';

export const testArticle: IArticle = {
    _id: 'test-id',
    headline: 'test headline',
    slugline: 'test slugline',
    byline: 'test byline',
    urgency: 3,
    priority: 6,
    genre: [],
    place: [],
    language: 'en',
    unique_name: '#1882',
    sign_off: 'test sign_off',
    flags: {},
    pubstatus: 'usable',
    schedule_settings: {
        utc_embargo: null,
        time_zone: null,
    },
    profile: '5acb792b2e03ed5d2a84bbe7',
    format: 'HTML',
    extra: {},
    _updated: '2019-12-06T17:55:49+0000',
    _created: '2019-12-06T17:55:49+0000',
    type: 'text',
    _etag: '5521a2155660fa3708d1fd4a61f3c9cb18a0d581',
    version: 1,
    template: '5acb792b2e03ed5d2a84bbe8',
    task: {
        desk: '5acb792b2e03ed5d2a84bbe6',
        stage: '5acb792b2e03ed5d2a84bbe4',
        user: '5acb79292e03ed5d2a84bbd6',
    },
    _current_version: 7,
    firstcreated: '2019-12-06T16:43:07+0000',
    versioncreated: '2019-12-06T17:41:43+0000',
    original_creator: '5acb79292e03ed5d2a84bbd6',
    guid: 'urn:newsml:localhost:5000:2019-12-06T17:43:07.357673:ab19ccb1-cf33-4f9d-8e23-85672403a345',
    unique_id: 1882,
    family_id: 'urn:newsml:localhost:5000:2019-12-06T17:43:07.357673:ab19ccb1-cf33-4f9d-8e23-85672403a345',
    event_id: 'tag:localhost:5000:2019:915f9d27-65eb-41ba-af5c-62c705dcecaa',
    state: ITEM_STATE.IN_PROGRESS,
    source: 'test source',
    operation: 'update',
    version_creator: '5acb79292e03ed5d2a84bbd6',
    expiry: null,
    lock_action: 'edit',
    lock_session: '5dea3a84d9699fd4487923ee',
    lock_time: '2019-12-06T17:41:47+0000',
    lock_user: '5acb79292e03ed5d2a84bbd6',
    force_unlock: true,
    _links: {},
    _status: 'OK',
};
