import React from 'react';
import {shallow} from 'enzyme';
import {IArticle, IArticleSideWidgetComponentType, IBaseRestApiResponse} from 'superdesk-api';
import {sdApi} from 'api';
import {dataApi} from 'core/helpers/CrudManager';
import {notify} from 'core/notify/notify';
import {addInternalEventListener} from 'core/internal-events';
import ng from 'core/services/ng';
import {RelatedItemsWidget} from '../related-items';

function article(overrides: Partial<IArticle>): IArticle {
    return {
        _id: 'item-1',
        _etag: 'etag-1',
        type: 'text',
        state: 'in_progress',
        profile: null,
        slugline: 'destination slugline',
        task: {desk: 'desk-1', stage: 'stage-1', user: 'user-1'},
        ...overrides,
    } as IArticle;
}

const source = article({_id: 'source-id', slugline: 'source slugline', headline: 'source headline'});

/**
 * Only the http call is stubbed, so the test covers the patching api the widget picks as well as
 * the way it reports the outcome. An api that swallows rejections would fail these.
 */
describe('related items widget: associating metadata', () => {
    let replaceAuthoringData: jasmine.Spy;
    let removeListener: () => void;

    function renderWidget() {
        const props = {article: article({}), readOnly: false} as IArticleSideWidgetComponentType;

        // the widget only looks up existing relations on mount, which is irrelevant here
        return shallow(<RelatedItemsWidget {...props} />, {disableLifecycleMethods: true})
            .instance() as RelatedItemsWidget;
    }

    beforeEach(() => {
        spyOn(sdApi.localStorage, 'getItem').and.returnValue(null);
        spyOn(notify, 'success');
        spyOn(notify, 'error');

        replaceAuthoringData = jasmine.createSpy('replaceAuthoringDataWithChanges');
        removeListener = addInternalEventListener('replaceAuthoringDataWithChanges', replaceAuthoringData);
    });

    afterEach(() => {
        removeListener();
    });

    it('reports success and updates the editor once the patch is persisted', (done) => {
        spyOn(dataApi, 'patchRaw').and.returnValue(
            Promise.resolve({_id: 'item-1', _etag: 'etag-2'} as IBaseRestApiResponse),
        );

        renderWidget().associateMetadata(source);

        setTimeout(() => {
            expect(replaceAuthoringData).toHaveBeenCalled();
            expect(notify.success).toHaveBeenCalled();
            expect(notify.error).not.toHaveBeenCalled();
            done();
        });
    });

    it('reports the error and leaves the editor untouched when the patch is rejected', (done) => {
        spyOn(dataApi, 'patchRaw').and.callFake(() => Promise.reject({
            _status: 'ERR',
            _error: {code: 412, message: 'Client and server etags do not match'},
            _issues: {},
        }));

        renderWidget().associateMetadata(source);

        setTimeout(() => {
            expect(replaceAuthoringData).not.toHaveBeenCalled();
            expect(notify.success).not.toHaveBeenCalled();
            expect(notify.error).toHaveBeenCalledWith(
                'Failed to associate metadata: Client and server etags do not match',
            );
            done();
        });
    });
});

describe('related items widget: searching', () => {
    // the configuration is owned by the widget sidebar and handed down, so a widget that kept its
    // own copy would search with stale settings
    it('searches with the configuration it is given', () => {
        const fetchRelatableItems = jasmine.createSpy('fetchRelatableItems')
            .and.returnValue(Promise.resolve({_items: []}));

        spyOn(ng, 'get').and.callFake(
            (service: string) => service === 'familyService' ? {fetchRelatableItems} : null,
        );

        const props = {
            article: article({}),
            readOnly: false,
            configuration: {sluglineMatch: 'PREFIX', modificationDateAfter: 'now-24h'},
        } as IArticleSideWidgetComponentType;

        const widget = shallow(<RelatedItemsWidget {...props} />, {disableLifecycleMethods: true})
            .instance() as RelatedItemsWidget;

        widget.setState({mode: 'search', keyword: 'destination slugline'});
        widget.search();

        expect(fetchRelatableItems).toHaveBeenCalledWith(
            'destination slugline',
            'PREFIX',
            jasmine.anything(),
            'now-24h',
        );
    });
});
