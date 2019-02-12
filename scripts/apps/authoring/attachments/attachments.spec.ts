import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import {attachments as attachmentsReducer} from './reducer';
import * as actions from './actions';

describe('attachments', () => {
    beforeEach(window.module('superdesk.apps.authoring.attachments'));

    it('can get item by id and cache it', (done) => inject((attachments, api, $q, $rootScope) => {
        spyOn(api, 'find').and.returnValue($q.when({_id: 'foo'}));

        attachments.byId('foo').then((attachment) => {
            expect(attachment._id).toBe('foo');
            expect(api.find.calls.count()).toBe(1);
            return attachments.byId('foo');
        })
            .then((attachment) => {
                expect(api.find.calls.count()).toBe(1);
                attachments.save({_id: 'foo'}, {});
                return attachments.byId('foo');
            })
            .then((attachment) => {
                expect(api.find.calls.count()).toBe(2);
            })
            .then(done)
            .catch(done.fail);

        $rootScope.$digest();
    }));

    describe('attachments store', () => {
        let store;

        beforeEach(inject((attachments, deployConfig) => {
            store = createStore(attachmentsReducer, applyMiddleware(thunk.withExtraArgument({
                attachments: attachments,
                deployConfig: deployConfig,
            })));
        }));

        it('can init attachments', inject((api, deployConfig, $q, $rootScope) => {
            const item = {};
            const files = ['foo'];

            spyOn(api, 'query').and.returnValue($q.when({_items: files}));
            spyOn(deployConfig, 'getSync').and.returnValue(100);

            store.dispatch(actions.initAttachments(item));
            $rootScope.$digest();

            expect(store.getState().maxSize).toBe(100);
            expect(store.getState().maxFiles).toBe(100);
            expect(store.getState().files).toBe(files);
        }));
    });
});
