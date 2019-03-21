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
        const item = {};
        const file = {title: 'foo'};
        const files = [file];

        beforeEach(inject((attachments, deployConfig, api, $q, $rootScope) => {
            store = createStore(attachmentsReducer, applyMiddleware(thunk.withExtraArgument({
                attachments: attachments,
                deployConfig: deployConfig,
            })));

            spyOn(deployConfig, 'getSync').and.returnValue(100);
            spyOn(api, 'query').and.returnValue($q.when({_items: files}));

            store.dispatch(actions.initAttachments(item));
            $rootScope.$digest();
        }));

        it('can init attachments', inject(() => {
            expect(store.getState().maxSize).toBe(100);
            expect(store.getState().maxFiles).toBe(100);
            expect(store.getState().files).toBe(files);
        }));

        it('can edit item', inject((api, $q, $rootScope) => {
            const updates = {description: 'bar'};

            store.dispatch(actions.editFile(file));
            expect(store.getState().edit).toBe(file);

            store.dispatch(actions.closeEdit());
            expect(store.getState().edit).toBe(null);

            store.dispatch(actions.editFile(file));

            spyOn(api, 'save').and.returnValue($q.when(Object.assign({}, file, updates)));
            store.dispatch(actions.saveFile(file, {description: 'foo'}));
            $rootScope.$digest();

            const state = store.getState();

            expect(state.edit).toBe(null);
            expect(state.files[0].title).toBe(file.title);
            expect(state.files[0].description).toBe(updates.description);
        }));
    });
});
