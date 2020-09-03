import {AuthoringWorkspaceService} from '../authoring/services/AuthoringWorkspaceService';
import _ from 'lodash';
import {appConfig} from 'appConfig';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {mediaIdGenerator} from '../authoring/services/MediaIdGeneratorService';

describe('authoring', () => {
    var GUID = 'urn:tag:superdesk-1';
    var USER = 'user:1';
    var ITEM: any = {guid: GUID};

    beforeEach(window.module(($provide) => {
        $provide.constant('lodash', _);
    }));

    beforeEach(window.module('angular-embed'));
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.core.preferences'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.core.auth'));
    beforeEach(window.module('superdesk.apps.workspace.content'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.core.privileges'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.core.editor3'));
    beforeEach(window.module('superdesk.apps.editor2'));
    beforeEach(window.module('superdesk.apps.extension-points'));
    beforeEach(window.module('superdesk.apps.spellcheck'));

    beforeEach(inject(($window) => {
        $window.onbeforeunload = angular.noop;
    }));

    beforeEach(inject((preferencesService, desks, $q) => {
        spyOn(preferencesService, 'get').and.returnValue($q.when({items: ['urn:tag:superdesk-1']}));
        spyOn(preferencesService, 'update').and.returnValue($q.when({}));
        spyOn(preferencesService, 'getPrivileges').and.returnValue($q.when({}));
        spyOn(desks, 'fetchCurrentUserDesks').and.returnValue($q.when([]));
    }));

    beforeEach(inject(($route) => {
        $route.current = {params: {_id: GUID}};
    }));

    beforeEach(inject((session) => {
        session.start({_id: 'sess'}, {_id: USER});
        expect(session.identity._id).toBe(USER);
    }));

    beforeEach(inject(($httpBackend) => {
        $httpBackend.whenGET(/api$/).respond({_links: {child: []}});
    }));

    it('can open an item',
        inject((superdesk, api, lock, autosave, $injector, $q, $rootScope) => {
            var _item,
                lockedItem = angular.extend({_locked: false}, ITEM);

            spyOn(api, 'find').and.returnValue($q.when(ITEM));
            spyOn(lock, 'lock').and.returnValue($q.when(lockedItem));
            spyOn(autosave, 'open').and.returnValue($q.when(lockedItem));

            $injector.invoke(superdesk.activity('authoring').resolve.item).then((resolvedItem) => {
                _item = resolvedItem;
            });

            $rootScope.$digest();

            expect(api.find).toHaveBeenCalledWith('archive', GUID, jasmine.any(Object));
            expect(lock.lock).toHaveBeenCalledWith(ITEM, false, undefined);
            expect(autosave.open).toHaveBeenCalledWith(lockedItem);
            expect(_item.guid).toBe(GUID);
        }));

    it('does lock item only once',
        inject((superdesk, api, lock, autosave, session, $injector, $q, $rootScope) => {
            var lockedItem: any = ITEM;

            lockedItem.lock_user = USER;
            lockedItem.lock_session = session.sessionId;

            spyOn(api, 'find').and.returnValue($q.when(lockedItem));

            $injector.invoke(superdesk.activity('authoring').resolve.item);
            $rootScope.$digest();
            expect(ITEM._locked).toBe(true);
        }));

    it('unlocks a locked item and locks by current user',
        inject((authoring, lock, $rootScope, $timeout, api, $q, $location) => {
            spyOn(api, 'save').and.returnValue($q.when({}));
            spyOn(lock, 'unlock').and.returnValue($q.when({}));

            var lockedItem = {guid: GUID, _id: GUID, _locked: true, lock_user: 'user:5', task: 'desk:1'};
            var $scope = startAuthoring(lockedItem, 'edit');

            $rootScope.$digest();

            $scope.unlock();
            $timeout.flush(5000);
            $rootScope.$digest();
            expect($location.path(), '/authoring/' + $scope.item._id);
        }));

    it('can use a previously created autosave', inject(() => {
        var $scope = startAuthoring({_autosave: {headline: 'test'}}, 'edit');

        expect($scope.item._autosave.headline).toBe('test');
        expect($scope.item.headline).toBe('test');
    }));

    it('can save while item is being autosaved', (done) => inject(($rootScope, $timeout, $q, api) => {
        var $scope = startAuthoring({headline: 'test', task: 'desk:1'}, 'edit');

        $scope.item.body_html = 'test';
        $rootScope.$digest();
        $timeout.flush(1000);

        spyOn(api, 'save').and.returnValue(Promise.resolve({}));
        $scope.save();
        $rootScope.$digest();

        $timeout.flush(5000);

        setTimeout(() => { // save uses async middleware. HTTP request will be started asynchronously
            expect($scope.item._autosave).toBeNull();

            done();
        });
    }));

    it('can close item after save work confirm', inject(($rootScope, $q, $location, authoring, reloadService) => {
        startAuthoring({headline: 'test'}, 'edit');
        $location.search('item', 'foo');
        $location.search('action', 'edit');
        $rootScope.$digest();

        spyOn(authoring, 'saveWorkConfirmation').and.returnValue($q.when());
        spyOn(reloadService, 'forceReload');

        $rootScope.$broadcast('savework', 'test');
        $rootScope.$digest();

        expect($location.search().item).toBe(undefined);
        expect($location.search().action).toBe(undefined);
        expect(reloadService.forceReload).toHaveBeenCalled();
    }));

    it('can populate content metadata for undo', inject(($rootScope) => {
        var orig = {headline: 'foo'};
        var scope = startAuthoring(orig, 'edit');

        expect(scope.origItem.headline).toBe('foo');
        expect(scope.item.headline).toBe('foo');
        expect(scope.item.slugline).toBe('');
        scope.$apply(() => {
            scope.origItem.headline = 'bar';
            scope.origItem.slugline = 'slug';
        });
        expect(scope.item.headline).toBe('foo');
        expect(scope.item.slugline).toBe('');
    }));

    it('confirm the associated media not called',
        inject((api, $q, $rootScope, confirm) => {
            let item = {
                _id: 'test',
                headline: 'headline',
            };

            let rewriteOf = {
                _id: 'rewriteOf',
                headline: 'rewrite',
                associations: {
                    featuremedia: {

                    },
                },
            };

            let defered = $q.defer();

            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                features: {
                    ...appConfig.features,
                    editFeaturedImage: 1,
                },
            };

            Object.assign(appConfig, testConfig);

            spyOn(api, 'find').and.returnValue($q.when({rewriteOf}));
            spyOn(confirm, 'confirmFeatureMedia').and.returnValue(defered.promise);
            let scope = startAuthoring(item, 'edit');

            scope.publish();
            $rootScope.$digest();
            expect(confirm.confirmFeatureMedia).not.toHaveBeenCalled();
            expect(api.find).not.toHaveBeenCalledWith('archive', 'rewriteOf');
        }));

    it('confirm the associated media not called if not rewrite_of',
        inject((api, $q, $rootScope, confirm) => {
            let item = {
                _id: 'test',
                headline: 'headline',
            };

            let rewriteOf = {
                _id: 'rewriteOf',
                headline: 'rewrite',
                associations: {
                    featuremedia: {

                    },
                },
            };

            let defered = $q.defer();

            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                features: {
                    ...appConfig.features,
                    editFeaturedImage: 1,
                    confirmMediaOnUpdate: 1,
                },
            };

            Object.assign(appConfig, testConfig);

            spyOn(api, 'find').and.returnValue($q.when({rewriteOf}));
            spyOn(confirm, 'confirmFeatureMedia').and.returnValue(defered.promise);
            let scope = startAuthoring(item, 'edit');

            scope.publish();
            $rootScope.$digest();
            expect(confirm.confirmFeatureMedia).not.toHaveBeenCalled();
            expect(api.find).not.toHaveBeenCalledWith('archive', 'rewriteOf');
        }));

    it('confirm the associated media called if rewrite_of but no associated media on edited item',
        (done) => inject((api, $q, $rootScope, confirm, authoring) => {
            let item = {
                _id: 'test',
                headline: 'headline',
                rewrite_of: 'rewriteOf',
            };

            let rewriteOf = {
                _id: 'rewriteOf',
                headline: 'rewrite',
                associations: {
                    featuremedia: {

                    },
                },
            };

            let defered = $q.defer();

            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                features: {
                    ...appConfig.features,
                    editFeaturedImage: 1,
                    confirmMediaOnUpdate: 1,
                },
            };

            Object.assign(appConfig, testConfig);

            spyOn(api, 'find').and.returnValue($q.when(rewriteOf));
            spyOn(confirm, 'confirmFeatureMedia').and.returnValue(defered.promise);
            spyOn(authoring, 'autosave').and.returnValue(Promise.resolve(item));
            spyOn(authoring, 'publish').and.returnValue(item);
            let scope = startAuthoring(item, 'edit');

            scope.publish();
            $rootScope.$digest();

            setTimeout(() => { // let onPublishMiddlewares promise resolve
                expect(api.find).toHaveBeenCalledWith('archive', 'rewriteOf');
                defered.resolve(rewriteOf);
                $rootScope.$digest();
                expect(confirm.confirmFeatureMedia).toHaveBeenCalledWith(rewriteOf);

                setTimeout(() => { // let applyMiddleware promise resolve
                    expect(authoring.autosave).toHaveBeenCalled();
                    expect(authoring.publish).not.toHaveBeenCalled();
                    done();
                }, 10);
            }, 10);
        }));

    it('confirm the associated media but do not use the associated media',
        (done) => inject((api, $q, $rootScope, confirm, authoring) => {
            let item = {
                _id: 'test',
                rewrite_of: 'rewriteOf',
            };

            let rewriteOf = {
                _id: 'rewriteOf',
                associations: {
                    featuremedia: {
                        test: 'test',
                    },
                },
            };

            let defered = $q.defer();

            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                features: {
                    ...appConfig.features,
                    editFeaturedImage: 1,
                    confirmMediaOnUpdate: 1,
                },
            };

            Object.assign(appConfig, testConfig);

            spyOn(api, 'find').and.returnValue($q.when(rewriteOf));
            spyOn(confirm, 'confirmFeatureMedia').and.returnValue(defered.promise);
            spyOn(authoring, 'autosave').and.returnValue({});
            spyOn(authoring, 'publish').and.returnValue({});
            let scope = startAuthoring(item, 'edit');

            scope.publish();
            $rootScope.$digest();
            setTimeout(() => { // let onPublishMiddlewares promise resolve
                expect(api.find).toHaveBeenCalledWith('archive', 'rewriteOf');
                defered.resolve({});
                $rootScope.$digest();
                expect(confirm.confirmFeatureMedia).toHaveBeenCalledWith(rewriteOf);

                setTimeout(() => { // let applyMiddleware promise resolve
                    expect(authoring.publish).toHaveBeenCalled();
                    expect(authoring.autosave).not.toHaveBeenCalled();
                    done();
                }, 10);
            }, 10);
        }));

    it('can reject publishing on error', inject((api, $q, $rootScope, authoring, lock) => {
        let success = jasmine.createSpy('success');
        let error = jasmine.createSpy('error');

        spyOn(api, 'update').and.returnValue($q.reject('err'));
        spyOn(lock, 'unlock').and.returnValue();

        authoring.publish({}, {}).then(success, error);
        $rootScope.$digest();

        expect(api.update).toHaveBeenCalled();
        expect(lock.unlock).not.toHaveBeenCalled();
        expect(success).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalledWith('err');
    }));

    it('can continue publishing on unlock error', inject((api, $q, $rootScope, authoring, lock) => {
        let success = jasmine.createSpy('success');
        let error = jasmine.createSpy('error');
        let item = {};

        spyOn(api, 'update').and.returnValue($q.when(item));
        spyOn(lock, 'unlock').and.returnValue($q.reject({}));

        authoring.publish({}, {}).then(success, error);
        $rootScope.$digest();

        expect(lock.unlock).toHaveBeenCalledWith(item);
        expect(success).toHaveBeenCalledWith(item);
        expect(error).not.toHaveBeenCalled();
    }));

    /**
     * Start authoring ctrl for given item.
     *
     * @param {object} item
     * @param {string} action
     * @returns {object}
     */
    function startAuthoring(item, action) {
        var $scope;

        inject(($rootScope, $controller, superdesk, $compile) => {
            $scope = $rootScope.$new();
            $controller(superdesk.activity('authoring').controller, {
                $scope: $scope,
                item: item,
                action: action,
            });
            $compile(angular.element('<div sd-authoring-workspace><div sd-authoring></div></div>'))($scope);
        });

        return $scope;
    }

    describe('authoring service', () => {
        var confirmDefer;

        beforeEach(inject((confirm, lock, $q) => {
            confirmDefer = $q.defer();
            spyOn(confirm, 'confirm').and.returnValue(confirmDefer.promise);
            spyOn(confirm, 'confirmPublish').and.returnValue(confirmDefer.promise);
            spyOn(confirm, 'confirmSaveWork').and.returnValue(confirmDefer.promise);
            spyOn(confirm, 'confirmFeatureMedia').and.returnValue(confirmDefer.promise);
            spyOn(lock, 'unlock').and.returnValue($q.when());
        }));

        it('can check if an item is editable', inject((authoring, session) => {
            expect(authoring.isEditable({})).toBe(false);
            expect(authoring.isEditable({lock_user: session.identity._id, lock_session: session.sessionId}))
                .toBe(true);
        }));

        it('can close a read-only item', inject((authoring, confirm, lock, $rootScope) => {
            var done = jasmine.createSpy('done');

            authoring.close({}).then(done);
            $rootScope.$digest();

            expect(confirm.confirm).not.toHaveBeenCalled();
            expect(lock.unlock).not.toHaveBeenCalled();
            expect(done).toHaveBeenCalled();
        }));

        it('can unlock on close editable item without changes made',
            inject((authoring, confirm, lock, $rootScope) => {
                expect(authoring.isEditable(ITEM)).toBe(true);
                authoring.close(ITEM, false);
                $rootScope.$digest();
                expect(confirm.confirm).not.toHaveBeenCalled();
                expect(lock.unlock).toHaveBeenCalled();
            }));

        it('confirms if an item is dirty and saves',
            inject((authoring, confirm, lock, $q, $rootScope) => {
                var edit = Object.create(ITEM);

                edit.headline = 'test';

                authoring.close(edit, ITEM, true);
                $rootScope.$digest();

                expect(confirm.confirm).toHaveBeenCalled();
                expect(lock.unlock).not.toHaveBeenCalled();

                spyOn(authoring, 'save').and.returnValue($q.when());
                confirmDefer.resolve();
                $rootScope.$digest();

                expect(authoring.save).toHaveBeenCalledWith(ITEM, edit);
                expect(lock.unlock).toHaveBeenCalled();
            }));

        it('confirms if an item is dirty on opening new or existing item and not unlocking on save',
            inject((authoring, confirm, lock, $q, $rootScope) => {
                var edit = Object.create(ITEM);

                edit.headline = 'test';

                authoring.close(edit, ITEM, true, true);
                $rootScope.$digest();

                expect(confirm.confirm).toHaveBeenCalled();
                expect(lock.unlock).not.toHaveBeenCalled();

                spyOn(authoring, 'save').and.returnValue($q.when());
                confirmDefer.resolve();
                $rootScope.$digest();

                expect(authoring.save).toHaveBeenCalledWith(ITEM, edit);
                expect(lock.unlock).not.toHaveBeenCalled();
            }));

        it('can unlock an item', inject((authoring, session, confirm, autosave) => {
            var item = {lock_user: session.identity._id, lock_session: session.sessionId};

            expect(authoring.isEditable(item)).toBe(true);
            spyOn(confirm, 'unlock');
            spyOn(autosave, 'stop');
            authoring.unlock(item);
            expect(authoring.isEditable(item)).toBe(false);
            expect(confirm.unlock).toHaveBeenCalled();
            expect(autosave.stop).toHaveBeenCalled();
        }));
        it('can publish items', inject((authoring, api, $q) => {
            var item = {_id: 1, state: 'submitted'};

            spyOn(api, 'update').and.returnValue($q.when());
            authoring.publish(item);
            expect(api.update).toHaveBeenCalledWith('archive_publish', item, {},
                {publishing_warnings_confirmed: false});
        }));

        it('confirms if an item is dirty and saves and publish',
            inject((authoring, api, confirm, lock, $q, $rootScope) => {
                var edit = Object.create(ITEM);

                _.extend(edit, {
                    _id: 1,
                    headline: 'test',
                    lock_user: 'user:1',
                    state: 'submitted',
                });

                authoring.publishConfirmation(ITEM, edit, true, 'publish');
                $rootScope.$digest();

                expect(confirm.confirmPublish).toHaveBeenCalled();
                expect(lock.unlock).not.toHaveBeenCalled();

                spyOn(api, 'update').and.returnValue($q.when(_.extend({}, edit, {})));

                authoring.publish(edit);
                $rootScope.$digest();

                expect(api.update).toHaveBeenCalledWith('archive_publish', edit, {},
                    {publishing_warnings_confirmed: false});
                expect(lock.unlock).toHaveBeenCalled();
            }));

        it('confirms if an item is dirty and save work in personal',
            inject((authoring, api, confirm, lock, $q, $rootScope) => {
                var edit = Object.create(ITEM);

                _.extend(edit, {
                    task: {desk: null, stage: null, user: 1},
                    type: 'text',
                    version: 1,
                });

                authoring.saveWorkConfirmation(ITEM, edit, true, 'User is disabled');
                $rootScope.$digest();

                expect(confirm.confirmSaveWork).toHaveBeenCalled();

                spyOn(api, 'save').and.returnValue($q.when(_.extend({}, edit, {})));

                authoring.saveWork(edit);
                $rootScope.$digest();

                expect(api.save).toHaveBeenCalledWith('archive', {}, edit);
            }));

        it('close the published dirty item without confirmation',
            inject((authoring, api, confirm, lock, autosave, $q, $rootScope) => {
                var publishedItem = Object.create(ITEM);

                publishedItem.state = 'published';
                var edit = Object.create(publishedItem);

                edit.headline = 'test';
                spyOn(authoring, 'isEditable').and.returnValue(true);
                spyOn(autosave, 'drop').and.returnValue($q.when({}));
                authoring.close(edit, publishedItem, true, false);
                $rootScope.$digest();
                expect(confirm.confirm).not.toHaveBeenCalled();
                expect(lock.unlock).toHaveBeenCalled();
                expect(autosave.drop).toHaveBeenCalled();
            }));

        it('close the corrected dirty item without confirmation',
            inject((authoring, api, confirm, lock, autosave, $q, $rootScope) => {
                var publishedItem = Object.create(ITEM);

                publishedItem.state = 'corrected';
                var edit = Object.create(publishedItem);

                edit.headline = 'test';
                spyOn(authoring, 'isEditable').and.returnValue(true);
                spyOn(autosave, 'drop').and.returnValue($q.when({}));
                authoring.close(edit, publishedItem, true, false);
                $rootScope.$digest();
                expect(confirm.confirm).not.toHaveBeenCalled();
                expect(lock.unlock).toHaveBeenCalled();
                expect(autosave.drop).toHaveBeenCalled();
            }));

        it('can validate schedule', inject((authoring) => {
            var errors = authoring.validateSchedule('2010-10-10', '08:10:10', '2010-10-10T08:10:10', 'Europe/Prague');

            expect(errors).toBeTruthy();
            expect(errors.future).toBeTruthy();

            errors = authoring.validateSchedule('2099-10-10', '11:32:21', '2099-10-10T08:10:10', 'Europe/Prague');
            expect(errors).toBeFalsy();
        }));

        it('can validate schedule for pre utc timezone', inject((authoring, moment) => {
            // utc - 1h and matching server tz format
            var timestamp = moment.utc()
                .subtract(1, 'hours')
                .format()
                .replace('+00:00', '+0000');

            expect(authoring.validateSchedule(
                timestamp.slice(0, 10),
                timestamp.slice(11, 19),
                timestamp,
                'America/Toronto', // anything before utc
            )).toBeFalsy();
        }));

        it('updates orig item on save',
            (done) => inject((authoring, $rootScope, $httpBackend, $q, urls) => {
                var item = {headline: 'foo'};
                var orig: any = {_links: {self: {href: 'archive/foo'}}};

                spyOn(urls, 'item').and.returnValue($q.when(orig._links.self.href));
                $httpBackend.expectPATCH(orig._links.self.href, item)
                    .respond(200, {_etag: 'new', _current_version: 2});
                authoring.save(orig, item);
                $rootScope.$digest();

                setTimeout(() => { // save uses async middleware. HTTP request will be started asynchronously
                    $httpBackend.flush();
                    expect(orig._etag).toBe('new');
                    expect(orig._current_version).toBe(2);

                    done();
                });
            }));
    });

    describe('media identifer generator service', () => {
        it('generates media field identifer', () => {
            expect(mediaIdGenerator.getFieldVersionName('media1', null)).toBe('media1');
            expect(mediaIdGenerator.getFieldVersionName('media1', '1')).toBe('media1--1');
            expect(mediaIdGenerator.getFieldParts('media1')).toEqual(['media1', null]);
            expect(mediaIdGenerator.getFieldParts('media1--1')).toEqual(['media1', 1]);
        });
    });

    describe('carousel directive', () => {
        it('initializes the current related item identifer', inject(($rootScope, $compile) => {
            let scope = $rootScope.$new();
            let elem = $compile('<div sd-item-carousel data-item="item" data-items="items"></div>')(scope);

            scope.$digest();
            let iscope = elem.isolateScope();

            scope.item = {guid: 'item1', associations: {'media1--1': {guid: 'foo', type: 'picture'}}};
            scope.items = [{fieldId: 'media1--1', 'media1--1': {guid: 'foo', type: 'picture'}},
                {fieldId: 'media1--2', 'media1--2': null}];
            scope.$digest();
            expect(iscope.rel).toBe('media1--2');

            scope.item = {guid: 'item1', associations: {'media1--1': null}};
            scope.items = [{fieldId: 'media1--1', 'media1--1': null}];
            scope.$digest();
            expect(iscope.rel).toBe('media1--1');
        }));
    });
});

describe('Item Crops directive', () => {
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.core.editor3'));
    beforeEach(window.module('superdesk.apps.editor2'));

    it('showCrops return true if image renditions are present',
        inject(($rootScope, $compile, $q, metadata, vocabularies) => {
            var metaInit = $q.defer();

            metadata.values = {
                crop_sizes: [
                    {name: '4-3'}, {name: '16-9'},
                ],
            };

            spyOn(metadata, 'initialize').and.returnValue(metaInit.promise);
            spyOn(vocabularies, 'getAllActiveVocabularies').and.returnValue($q.when([]));

            let scope = $rootScope.$new();

            scope.item = {
                type: 'picture',
                renditions: {
                },
            };

            var elem = $compile('<div sd-item-crops data-item="item"></div>')(scope);

            metaInit.resolve();
            scope.$digest();

            let iScope = elem.isolateScope();

            expect(iScope.showCrops()).not.toBe(true);

            scope.item = {
                type: 'picture',
                renditions: {
                    '4-3': {
                    },
                },
            };

            scope.$digest();

            expect(iScope.showCrops()).toBe(true);
        }),
    );
});

describe('autosave', () => {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject(($httpBackend) => {
        $httpBackend.whenGET(/api$/).respond({_links: {child: []}});
    }));

    it('can fetch an autosave for item locked by user and is editable',
        inject((autosave, api, $q, $rootScope) => {
            spyOn(api, 'find').and.returnValue($q.when({}));
            autosave.open({_locked: true, _editable: true, _id: 1});
            $rootScope.$digest();
            expect(api.find).toHaveBeenCalledWith('archive_autosave', 1);
        }));

    it('will skip autosave fetch when item is locked by user but not editable',
        inject((autosave, api, $q, $rootScope) => {
            spyOn(api, 'find').and.returnValue($q.when({}));
            autosave.open({_locked: false, _editable: false, _id: 1});
            $rootScope.$digest();
            expect(api.find).not.toHaveBeenCalled();
        }));

    it('will skip autosave fetch when item is locked by another user',
        inject((autosave, api, $rootScope) => {
            spyOn(api, 'find');
            autosave.open({_locked: true});
            $rootScope.$digest();
            expect(api.find).not.toHaveBeenCalled();
        }));

    it('can create an autosave', (done) => inject((autosave, api, $timeout, $rootScope) => {
        var orig: any = {_id: 1, _etag: 'x', _locked: true, _editable: true};
        var item = Object.create(orig);

        item.headline = 'test';
        spyOn(api, 'save').and.returnValue(Promise.resolve({_id: 2}));

        autosave.save(
            item,
            orig,
            0,
            () => {
                expect(api.save).toHaveBeenCalledWith('archive_autosave', {}, {_id: 1, headline: 'test'});
                expect(orig._autosave._id).toBe(2);
                expect(item.headline).toBe('test');
                expect(orig.headline).not.toBe('test');

                done();
            },
        );

        expect(api.save).not.toHaveBeenCalled();
        $rootScope.$digest();
        $timeout.flush(5000);
    }));
});

describe('lock service', () => {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.spellcheck'));

    var user = {_id: 'user'};
    var sess = {_id: 'sess'};
    var anotherUser = {_id: 'another_user'};

    beforeEach(inject((session) => {
        session.start(sess, user);
    }));

    beforeEach(inject(($httpBackend) => {
        $httpBackend.whenGET(/api$/).respond({_links: {child: []}});
    }));

    it('can test if item is locked', inject((lock) => {
        expect(lock.isLocked({})).toBe(false);
        expect(lock.isLocked({lock_user: '1'})).toBe(true);
    }));

    it('can detect lock by same user and different session', inject((lock) => {
        expect(lock.isLocked({lock_user: 'user'})).toBe(true);
        expect(lock.isLocked({lock_user: 'user', lock_session: 'other_sess'})).toBe(true);
    }));

    it('can use lock_user dict', inject((lock, session) => {
        expect(lock.isLocked({lock_user: {_id: 'user'}})).toBe(true);
        expect(lock.isLocked({lock_user: {_id: 'user'}, lock_session: session.sessionId})).toBe(false);
    }));

    it('can unlock the item if user has unlock privileges', inject((lock, privileges, $rootScope) => {
        privileges.setUserPrivileges({unlock: 1});
        $rootScope.$digest();
        // testing if the user can unlock its own content.
        expect(lock.can_unlock({lock_user: user._id})).toBe(true);
        expect(lock.can_unlock({lock_user: user._id, lock_session: 'another_session'})).toBe(true);
        expect(lock.can_unlock({lock_user: anotherUser._id, lock_session: 'another_session'})).toBe(1);
    }));

    it('can unlock the item if user has no unlock privileges', inject((lock, privileges, $rootScope) => {
        privileges.setUserPrivileges({unlock: 0});
        $rootScope.$digest();
        // testing if the user can unlock its own content.
        expect(lock.can_unlock({lock_user: user._id})).toBe(true);
        expect(lock.can_unlock({lock_user: user._id, lock_session: 'another_session'})).toBe(true);
        expect(lock.can_unlock({lock_user: anotherUser._id, lock_session: 'another_session'})).toBe(0);
    }));

    it('can unlock own draft but not other users item', inject((lock, privileges, $rootScope) => {
        privileges.setUserPrivileges({unlock: 1});
        $rootScope.$digest();
        // testing if the user can unlock its own content.
        expect(lock.can_unlock({lock_user: user._id, state: 'draft'})).toBe(true);
        expect(lock.can_unlock({lock_user: user._id, state: 'draft', lock_session: 'another_session'})).toBe(true);
        var item = {lock_user: anotherUser._id, state: 'draft', lock_session: 'another_session'};

        expect(lock.can_unlock(item)).toBe(false);
    }));
});

describe('authoring actions', () => {
    var userDesks = [{_id: 'desk1'}, {_id: 'desk2'}];

    /**
     * Assert the actions
     *
     * @param {Object} actions : actions to be asserted.
     * @param {string[]} keys : keys to be truthy.
     */
    function allowedActions(actions, keys) {
        _.forOwn(actions, (value, key) => {
            if (value) {
                expect(keys).toContain(key);
            } else {
                expect(keys).not.toContain(key);
            }
        });
    }

    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.spellcheck'));

    beforeEach(inject((desks, $q) => {
        spyOn(desks, 'fetchCurrentUserDesks').and.returnValue($q.when(userDesks));
    }));

    it('can perform actions if the item is located on the personal workspace',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'draft',
                flags: {marked_for_not_publication: false},
                type: 'text',
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'copy', 'spike', 'multi_edit', 'export', 'set_label']);
        }));

    it('can perform actions if the item is located on the desk',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'submitted',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                mark_for_desks: true,
                unlock: true,
                publish: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 're_write',
                'mark_item_for_highlight', 'mark_item_for_desks',
                'package_item', 'multi_edit', 'publish', 'add_to_current', 'export', 'set_label', 'send']);
        }));

    it('cannot perform publish if the item is marked for not publication',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'submitted',
                flags: {marked_for_not_publication: true},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 're_write',
                'mark_item_for_highlight', 'package_item', 'multi_edit', 'add_to_current',
                'export', 'set_label', 'send']);
        }));

    it('cannot perform publish if the item is highlight package',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'submitted',
                type: 'composite',
                highlight: 1,
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike',
                'package_item', 'multi_edit', 'add_to_current', 'set_label', 'send']);
        }));

    it('cannot publish if user does not have publish privileges on the desk',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'submitted',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: false,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 're_write',
                'mark_item_for_highlight', 'package_item', 'multi_edit', 'add_to_current',
                'export', 'set_label', 'send']);
        }));

    it('can only view the item if the user does not have desk membership',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'submitted',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk3',
                },
                _current_version: 2,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                mark_for_desks: false,
                unlock: true,
                archive: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['view', 're_write', 'export', 'set_label']);
        }));

    it('can also duplicateTo item which is on desk where is not a member when enabled via config',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'submitted',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk3',
                },
                _current_version: 2,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                mark_for_desks: false,
                unlock: true,
                archive: true,
            };

            appConfig.workflow_allow_duplicate_non_members = true;

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['view', 're_write', 'export', 'set_label', 'duplicateTo']);
        }));

    it('can only view the item if the item is killed',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'killed',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['view', 'export', 'set_label']);
        }));

    it('can only view the item if the item is recalled',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'recalled',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['view', 'export', 'set_label']);
        }));

    it('cannot create an update for a rewritten story ',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                type: 'text',
                rewritten_by: 1,
                task: {
                    desk: 'desk1',
                },
            };

            var userPrivileges = {
                archive: true,
                rewrite: true,
                unlock: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['view', 'package_item', 'multi_edit', 'add_to_current',
                'resend', 'export', 'set_label']);
        }));

    it('can only view or unmark item if the item is spiked',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'spiked',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions,
                ['view', 'unspike', 'export', 'mark_item_for_desks', 'mark_item_for_highlight', 'set_label']);
        }));

    it('Can perform correction or kill or takedown on published item',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 10,
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    marked_for_not_publication: false,
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                takedown: true,
                archive_broadcast: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['duplicate', 'duplicateTo', 'view', 'add_to_current',
                'mark_item_for_highlight', 'package_item', 'multi_edit', 'correct', 'takedown', 'kill', 're_write',
                'create_broadcast', 'resend', 'export', 'set_label']);
        }));

    it('Can perform resend on rewritten item',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item: any = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 10,
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    marked_for_not_publication: false,
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                archive_broadcast: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['duplicate', 'duplicateTo', 'view', 'add_to_current',
                'mark_item_for_highlight', 'package_item', 'multi_edit', 'correct', 'kill', 're_write',
                'create_broadcast', 'resend', 'export', 'set_label']);

            item.archive_item.rewritten_by = 'abc';
            itemActions = authoring.itemActions(item);
            allowedActions(itemActions, ['duplicate', 'view', 'add_to_current', 'mark_item_for_highlight',
                'package_item', 'multi_edit', 'correct', 'kill', 'create_broadcast', 'resend', 'export',
                'set_label', 'duplicateTo']);
        }));

    it('Cannot perform correction or kill or takedown on published item without privileges',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 10,
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    flags: {marked_for_not_publication: false},
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: false,
                kill: false,
                takedown: false,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['duplicate', 'duplicateTo', 'view', 'add_to_current',
                'mark_item_for_highlight', 'package_item', 'multi_edit', 're_write', 'resend',
                'export', 'set_label']);
        }));

    it('Can only view if the item is not the current version',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                last_published_version: false,
                _current_version: 8,
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    flags: {marked_for_not_publication: false},
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['view', 'export', 'set_label']);
        }));

    it('Can only view, duplicate and deschedule if the item is scheduled',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'scheduled',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 8,
                archive_item: {
                    _id: 'test',
                    state: 'scheduled',
                    flags: {marked_for_not_publication: false},
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 8,
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['view', 'duplicate', 'duplicateTo', 'deschedule', 'export', 'set_label']);
        }));

    it('Cannot send item if the version is zero',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 0,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                mark_for_desks: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                package_item: false,
                move: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 'add_to_current',
                'mark_item_for_highlight', 'package_item', 'multi_edit', 'publish', 'export',
                'mark_item_for_desks', 're_write', 'set_label']);
        }));

    it('Can edit if the version is zero',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 0,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                package_item: false,
                move: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 'add_to_current',
                'mark_item_for_highlight', 'package_item', 'multi_edit', 'publish', 'export',
                're_write', 'set_label']);
        }));

    it('Can send item even if there is no move privileges',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                package_item: false,
                move: false,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 'add_to_current',
                're_write', 'mark_item_for_highlight', 'package_item', 'multi_edit', 'publish',
                'export', 'set_label', 'send']);
        }));

    it('Can send item if the version greater then zero',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                package_item: false,
                move: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 'add_to_current',
                're_write', 'mark_item_for_highlight', 'package_item', 'multi_edit', 'publish',
                'send', 'export', 'set_label']);
        }));

    it('Can do edit for embargo item.',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
                embargo: Date(),
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                package_item: true,
                move: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 'add_to_current',
                'mark_item_for_highlight', 'multi_edit', 'publish', 'send', 'export', 'set_label']);
        }));

    it('Can do edit for scheduled item.',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 1,
                publish_schedule: Date(),
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                package_item: true,
                move: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'duplicate', 'duplicateTo', 'spike', 'add_to_current',
                'mark_item_for_highlight', 'multi_edit', 'publish', 'send', 'export', 're_write',
                'set_label']);
        }));

    it('Can do rewrite and package item for scheduled item after passing publish schedule.',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var pastTimestamp = new Date();

            pastTimestamp.setHours(pastTimestamp.getHours() - 1);

            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 2,
                publish_schedule: pastTimestamp,
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                package_item: true,
                move: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['correct', 'kill', 'duplicate', 'duplicateTo', 'add_to_current', 're_write',
                'view', 'package_item', 'mark_item_for_highlight', 'multi_edit', 'resend', 'export',
                'set_label']);
        }));

    it('Create broadcast icon is available for text item.',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 10,
                genre: [],
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    flags: {marked_for_not_publication: false},
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                    genre: [],
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                archive_broadcast: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['duplicate', 're_write', 'mark_item_for_highlight', 'multi_edit',
                'correct', 'kill', 'package_item', 'view', 'create_broadcast', 'add_to_current', 'resend',
                'export', 'set_label', 'duplicateTo']);
        }));

    it('Create broadcast icon is available for text item with genre Article.',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 10,
                genre: [{name: 'Article', value: 'Article'}],
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    flags: {marked_for_not_publication: false},
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                    genre: [{name: 'Article', value: 'Article'}],
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                archive_broadcast: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['duplicate', 're_write', 'mark_item_for_highlight', 'multi_edit',
                'correct', 'kill', 'package_item', 'view', 'create_broadcast', 'add_to_current', 'resend',
                'export', 'set_label', 'duplicateTo']);
        }));

    it('Create broadcast icon is not available for broadcast item',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 10,
                genre: [
                    {name: 'Interview', value: 'Interview'},
                    {name: 'Broadcast Script', value: 'Broadcast Script'},
                ],
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    flags: {marked_for_not_publication: false},
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                    genre: [
                        {name: 'Interview', value: 'Interview'},
                        {name: 'Broadcast Script', value: 'Broadcast Script'},
                    ],
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                archive_broadcast: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['duplicate', 'duplicateTo', 'mark_item_for_highlight', 'multi_edit',
                'correct', 'kill', 'package_item', 'view', 'add_to_current', 'resend', 'export',
                're_write', 'set_label']);
        }));

    it('Export action is available for text item.',
        inject((privileges, authoring, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
            };

            var userPrivileges = {
                mark_item: false,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['re_write', 'save', 'edit', 'package_item',
                'multi_edit', 'add_to_current', 'export', 'set_label']);
        }));

    it('Export action is not available for non-text item.',
        inject((privileges, authoring, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'in_progress',
                flags: {marked_for_not_publication: false},
                type: 'composite',
                task: {
                    desk: 'desk1',
                },
            };

            var userPrivileges = {
                mark_item: false,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['save', 'edit', 'package_item', 'multi_edit', 'add_to_current',
                'set_label']);
        }));

    it('rewrite is not allowed if re-written item exists.',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            var item = {
                _id: 'test',
                state: 'published',
                flags: {marked_for_not_publication: false},
                type: 'text',
                task: {
                    desk: 'desk1',
                },
                _current_version: 10,
                rewritten_by: '123',
                genre: [
                    {name: 'Interview', value: 'Interview'},
                ],
                archive_item: {
                    _id: 'test',
                    state: 'published',
                    flags: {marked_for_not_publication: false},
                    type: 'text',
                    task: {
                        desk: 'desk1',
                    },
                    _current_version: 10,
                    rewritten_by: '123',
                    genre: [
                        {name: 'Interview', value: 'Interview'},
                    ],
                },
            };

            var userPrivileges = {
                duplicate: true,
                mark_item: false,
                spike: true,
                unspike: true,
                mark_for_highlights: true,
                unlock: true,
                publish: true,
                correct: true,
                kill: true,
                archive_broadcast: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            var itemActions = authoring.itemActions(item);

            allowedActions(itemActions, ['duplicate', 'duplicateTo', 'mark_item_for_highlight', 'multi_edit',
                'create_broadcast', 'correct', 'kill', 'package_item', 'view', 'add_to_current',
                'resend', 'export', 'set_label']);
        }));

    it('cannot mark or highlight if the item is not a text item',
        inject((privileges, desks, authoring, $q, $rootScope) => {
            let item = {
                _id: 'test',
                type: 'text',
                task: {
                    desk: 'desk1',
                },
            };

            let userPrivileges = {
                mark_for_highlights: true,
                mark_for_desks: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            let itemActions = authoring.itemActions(item);

            expect(itemActions.mark_item_for_desks).toBeTruthy();
            expect(itemActions.mark_item_for_highlight).toBeTruthy();

            item.type = 'picture';
            itemActions = authoring.itemActions(item);
            expect(itemActions.mark_item_for_desks).toBeFalsy();
            expect(itemActions.mark_item_for_highlight).toBeFalsy();
        }));
});

describe('authoring workspace', () => {
    var item, lockedItem;

    beforeEach(() => {
        item = {_id: 'foo', type: 'text'};
        lockedItem = {_id: item._id, _editable: true};
    });

    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject(($q, authoring) => {
        spyOn(authoring, 'open').and.returnValue($q.when(lockedItem));
    }));

    it('can edit item', inject((superdeskFlags, authoringWorkspace: AuthoringWorkspaceService, $rootScope) => {
        expect(superdeskFlags.flags.authoring).toBeFalsy();

        authoringWorkspace.edit(item);
        $rootScope.$apply();

        expect(authoringWorkspace.item).toBe(lockedItem);
        expect(authoringWorkspace.action).toBe('edit');
        expect(authoringWorkspace.getItem()).toBe(lockedItem);
        expect(authoringWorkspace.getAction()).toBe('edit');
        expect(superdeskFlags.flags.authoring).toBeTruthy();

        authoringWorkspace.close(true);
        expect(authoringWorkspace.item).toBe(null);
        expect(authoringWorkspace.getItem()).toBe(null);
        expect(superdeskFlags.flags.authoring).toBeFalsy();
    }));

    it('can open item in readonly mode', inject((
        superdeskFlags,
        authoringWorkspace: AuthoringWorkspaceService,
        $rootScope,
    ) => {
        lockedItem._editable = false;
        authoringWorkspace.view(item);
        $rootScope.$apply();
        expect(authoringWorkspace.item).toBe(lockedItem);
        expect(authoringWorkspace.action).toBe('view');
        expect(superdeskFlags.flags.authoring).toBe(true);
        lockedItem._editable = true;
    }));

    it('can kill an item', inject((authoringWorkspace: AuthoringWorkspaceService, $rootScope) => {
        authoringWorkspace.kill(item);
        $rootScope.$apply();
        expect(authoringWorkspace.item).toBe(lockedItem);
        expect(authoringWorkspace.action).toBe('kill');
    }));

    it('can handle edit.item activity', inject((
        superdesk,
        authoringWorkspace: AuthoringWorkspaceService,
        $rootScope,
    ) => {
        superdesk.intent('edit', 'item', item);
        $rootScope.$digest();
        expect(authoringWorkspace.item).toBe(lockedItem);
        expect(authoringWorkspace.action).toBe('edit');
    }));

    it('can open an item for edit or readonly', inject((
        authoringWorkspace: AuthoringWorkspaceService,
        authoring,
        send,
        $q,
        $rootScope,
    ) => {
        item.state = 'draft';
        authoringWorkspace.open(item);
        expect(authoring.open).toHaveBeenCalledWith(item._id, false, null, 'edit');

        item.state = 'published';
        authoringWorkspace.open(item);
        expect(authoring.open).toHaveBeenCalledWith(item._id, true, null, 'view');

        var archived = {_id: 'bar'};

        spyOn(send, 'validateAndSend').and.returnValue($q.when(archived));
        item._type = 'ingest';
        authoringWorkspace.open(item);
        expect(send.validateAndSend).toHaveBeenCalledWith(item);
        $rootScope.$digest();
        expect(authoring.open).toHaveBeenCalledWith(archived._id, false, null, 'edit');
    }));

    describe('init', () => {
        it('can open item from $location for editing', inject((api, $location, $rootScope, $injector) => {
            $location.search('item', item._id);
            $location.search('action', 'edit');
            $rootScope.$digest();

            var authoringWorkspace: AuthoringWorkspaceService = $injector.get('authoringWorkspace');

            $rootScope.$digest();

            expect(authoringWorkspace.item).toBe(lockedItem);
            expect(authoringWorkspace.action).toBe('edit');
        }));

        it('can open item from $location for viewing', inject(($location, $rootScope, $injector) => {
            $location.search('item', 'bar');
            $location.search('action', 'view');
            $rootScope.$digest();
            var authoringWorkspace: AuthoringWorkspaceService = $injector.get('authoringWorkspace');

            $rootScope.$digest();
            expect(authoringWorkspace.item).toBe(lockedItem);
            expect(authoringWorkspace.action).toBe('view');
        }));
    });
});

describe('authoring container directive', () => {
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject(($templateCache) => {
        // avoid loading of authoring
        $templateCache.put('scripts/apps/authoring/views/authoring-container.html', '<div></div>');
    }));

    var item, lockedItem, scope, elem, iscope;

    beforeEach(inject(($compile, $rootScope, $q, authoring) => {
        item = {_id: 'foo'};
        lockedItem = {_id: item._id, _editable: true};
        spyOn(authoring, 'open').and.returnValue($q.when(lockedItem));

        scope = $rootScope.$new();
        elem = $compile('<div sd-authoring-container></div>')(scope);
        scope.$digest();
        iscope = elem.isolateScope();
    }));

    it('handles edit', inject((authoringWorkspace: AuthoringWorkspaceService, $rootScope) => {
        authoringWorkspace.edit(item);
        $rootScope.$digest();

        // testing reset in first cycle between
        expect(iscope.authoring.item).toBe(null);

        $rootScope.$digest();

        expect(iscope.authoring.item).toBe(lockedItem);
        expect(iscope.authoring.action).toBe('edit');
        expect(iscope.authoring.state.opened).toBe(true);

        authoringWorkspace.close(true);
        $rootScope.$digest();
        expect(iscope.authoring.item).toBe(null);
        expect(iscope.authoring.state.opened).toBe(false);
    }));

    it('handles view', inject((authoringWorkspace: AuthoringWorkspaceService, $rootScope) => {
        lockedItem._editable = false;
        authoringWorkspace.view(item);
        $rootScope.$digest();
        $rootScope.$digest();
        expect(iscope.authoring.item).toBe(lockedItem);
        expect(iscope.authoring.action).toBe('view');
        expect(iscope.authoring.state.opened).toBe(true);
        lockedItem._editable = true;
    }));

    it('handles kill', inject((authoringWorkspace: AuthoringWorkspaceService, $rootScope) => {
        authoringWorkspace.kill(item);
        $rootScope.$digest();
        $rootScope.$digest();
        expect(iscope.authoring.item).toBe(lockedItem);
        expect(iscope.authoring.action).toBe('kill');
    }));

    it('handles correct', inject((authoringWorkspace: AuthoringWorkspaceService, $rootScope) => {
        authoringWorkspace.correct(item);
        $rootScope.$digest();
        $rootScope.$digest();
        expect(iscope.authoring.item).toBe(lockedItem);
        expect(iscope.authoring.action).toBe('correct');
    }));

    describe('authoring embed directive', () => {
        beforeEach(inject(($templateCache) => {
            $templateCache.put('scripts/apps/authoring/views/authoring.html', '<div></div>');
        }));

        it('applies kill template',
            inject((authoringWorkspace: AuthoringWorkspaceService, $rootScope, api, $compile, $q) => {
                authoringWorkspace.kill(item);
                $rootScope.$digest();
                $rootScope.$digest();
                expect(iscope.authoring.item).toBe(lockedItem);
                expect(iscope.authoring.action).toBe('kill');

                spyOn(api, 'save').and.returnValue($q.when({}));

                var elemEmbed = $compile('<div sd-authoring-embedded data-item="authoring.item"' +
                ' data-action="authoring.action"></div>')(iscope);

                iscope.$digest();
                var iscopeEmbed = elemEmbed.isolateScope();

                expect(iscopeEmbed.action).toBe('kill');
                expect(api.save)
                    .toHaveBeenCalledWith('content_templates_apply', {}, {
                        template_name: 'kill',
                        item: {_id: 'foo'},
                    }, {});
            }));
    });
});

describe('authoring themes', () => {
    beforeEach(window.module('superdesk.core.preferences'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject(($q, preferencesService) => {
        spyOn(preferencesService, 'get').and.returnValue($q.when({'editor:theme': ['theme:proofreadTheme']}));
    }));

    var normalTheme = {
            cssClass: '',
            label: 'Default',
            key: 'default',
        },
        darkTheme = {
            cssClass: 'dark-theme-mono',
            label: 'Dark monospace',
            key: 'dark-mono',
        };

    it('can define normal theme', inject((authThemes) => {
        spyOn(authThemes, 'save');
        authThemes.save('theme', normalTheme);
        expect(authThemes.save).toHaveBeenCalledWith('theme', normalTheme);
    }));

    it('can define proofread theme', inject((authThemes) => {
        spyOn(authThemes, 'save');
        authThemes.save('proofreadTheme', darkTheme);
        expect(authThemes.save).toHaveBeenCalledWith('proofreadTheme', darkTheme);
    }));

    it('can get normal theme', inject((authThemes, $rootScope) => {
        var theme = null;

        authThemes.get('theme').then((_theme) => {
            theme = _theme;
        });
        $rootScope.$digest();
        expect(theme).not.toBe(null);
    }));

    it('can get proofread theme', inject((authThemes, $rootScope) => {
        var proofreadTheme = null;

        authThemes.get('proofreadTheme').then((_theme) => {
            proofreadTheme = _theme;
        });
        $rootScope.$digest();
        expect(proofreadTheme).not.toBe(null);
    }));
});

describe('send item directive', () => {
    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {url: undefined, ws: undefined},
            iframely: {key: '123'},
            editor: {},
            features: {onlyEditor3: false},
        };

        Object.assign(appConfig, testConfig);
    });

    beforeEach(window.module('superdesk.core.editor3'));
    beforeEach(window.module('superdesk.apps.editor2'));
    beforeEach(window.module('superdesk.core.preferences'));
    beforeEach(window.module('superdesk.apps.authoring'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.extension-points'));

    beforeEach(inject(($templateCache) => {
        $templateCache.put('scripts/apps/authoring/views/send-item.html', '');
    }));

    it('can hide embargo if user does not have the privilege',
        inject(($compile, $rootScope, privileges) => {
            var scope, elem, iscope;

            scope = $rootScope.$new();
            scope.item = {
                _id: 'foo',
                type: 'text',
                state: 'in-progress',
            };
            var userPrivileges = {
                embargo: false,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            scope.action = 'edit';
            elem = $compile('<div sd-send-item data-item="item" data-mode="authoring" ' +
                'data-action="action"></div>')(scope);
            scope.$digest();
            iscope = elem.isolateScope();
            expect(iscope.showPublishSchedule()).toBe(true);
            expect(iscope.showEmbargo()).toBe(false);
        }));

    it('can show embargo and publish schedule for text item',
        inject(($compile, $rootScope, privileges) => {
            var scope, elem, iscope;

            scope = $rootScope.$new();
            scope.item = {
                _id: 'foo',
                type: 'text',
                state: 'in-progress',
            };
            var userPrivileges = {
                embargo: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            scope.action = 'edit';
            elem = $compile('<div sd-send-item data-item="item" data-mode="authoring" ' +
                'data-action="action"></div>')(scope);
            scope.$digest();
            iscope = elem.isolateScope();
            expect(iscope.showPublishSchedule()).toBe(true);
            expect(iscope.showEmbargo()).toBe(true);
        }));

    it('can show embargo date',
        inject(($compile, $rootScope, privileges) => {
            var scope, elem, iscope;

            scope = $rootScope.$new();
            scope.item = {
                _id: 'foo',
                type: 'text',
                state: 'in-progress',
                embargo_date: Date(),
            };
            var userPrivileges = {
                embargo: true,
            };

            privileges.setUserPrivileges(userPrivileges);
            $rootScope.$digest();
            scope.action = 'edit';
            elem = $compile('<div sd-send-item data-item="item" data-mode="authoring" ' +
                'data-action="action"></div>')(scope);
            scope.$digest();
            iscope = elem.isolateScope();
            expect(iscope.showPublishSchedule()).toBe(false);
            expect(iscope.showEmbargo()).toBe(true);
        }));

    it('can show published schedule date',
        inject(($compile, $rootScope) => {
            var scope, elem, iscope;

            scope = $rootScope.$new();
            scope.item = {
                _id: 'foo',
                type: 'text',
                state: 'in-progress',
                publish_schedule_date: Date(),
            };
            scope.action = 'edit';
            elem = $compile('<div sd-send-item data-item="item" data-mode="authoring" ' +
                'data-action="action"></div>')(scope);
            scope.$digest();
            iscope = elem.isolateScope();
            expect(iscope.showPublishSchedule()).toBe(true);
            expect(iscope.showEmbargo()).toBe(false);
        }));

    it('can get last destination desk and stage',
        inject(($compile, $rootScope, preferencesService, $q) => {
            var scope, elem, iscope;

            scope = $rootScope.$new();
            scope.item = {
                _id: '123456',
                type: 'text',
            };

            var destination = {desk: '123', stage: '456'};

            spyOn(preferencesService, 'get').and.returnValue($q.when(destination));

            scope.action = 'edit';
            elem = $compile('<div sd-send-item data-item="item" data-mode="authoring" ' +
                'data-action="action"></div>')(scope);

            scope.$digest();

            iscope = elem.isolateScope();
            iscope.destination_last = null;

            preferencesService.get().then((prefs) => {
                iscope.destination_last = {
                    desk: prefs.desk,
                    stage: prefs.stage,
                };
            });

            iscope.$digest();

            expect(iscope.destination_last.desk).toEqual('123');
            expect(iscope.destination_last.stage).toEqual('456');
        }));

    it('can show send and publish button',
        inject(($compile, $rootScope) => {
            var scope, elem, iscope;

            scope = $rootScope.$new();
            scope.item = {
                _id: 'foo',
                type: 'text',
                state: 'in-progress',
                task: {
                    desk: '123',
                    stage: '456',
                },
                _current_version: 1,
            };
            scope.action = 'edit';
            elem = $compile('<div sd-send-item data-item="item" data-orig="item" data-mode="authoring" ' +
                'data-action="action"></div>')(scope);
            scope.$digest();
            iscope = elem.isolateScope();
            expect(iscope.canSendAndPublish()).toBeFalsy();

            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                ui: {
                    ...appConfig.ui,
                    sendAndPublish: 1,
                },
            };

            Object.assign(appConfig, testConfig);

            expect(iscope.canSendAndPublish()).toBeFalsy();
            iscope.selectedDesk = {_id: '123'};
            iscope.selectedStage = {_id: '456'};
            expect(iscope.canSendAndPublish()).toBeFalsy();
            iscope.selectedDesk = {_id: '123'};
            iscope.selectedStage = {_id: '4566'};
            iscope.itemActions = {publish: 1};
            expect(iscope.canSendAndPublish()).toBeFalsy();
            iscope.selectedDesk = {_id: '1234'};
            iscope.selectedStage = {_id: '456'};
            expect(iscope.canSendAndPublish()).toBeTruthy();
        }));

    describe('Send And Publish', () => {
        var scope, iScope, elem, publish;
        var movedItem = {
            _id: 'foo',
            type: 'text',
            state: 'in-progress',
            task: {
                desk: 'New Desk',
                stage: 'New Stage',
            },
            _current_version: 2,
            _etag: '1111',
            _locked: true,
        };

        var selectedDesk = {
            _id: 'New Desk', name: 'new desk',
        };

        var selectedStage = {
            _id: 'New Stage', name: 'new stage',
        };

        beforeEach(inject(($q, $compile, $rootScope, api, editor) => {
            spyOn(api, 'find').and.returnValue($q.when({}));
            spyOn(api, 'save').and.returnValue($q.when({task: {desk: 'new', stage: 'new'}}));

            scope = $rootScope.$new();
            scope.item = {
                _id: 'foo',
                type: 'text',
                state: 'in-progress',
                task: {
                    desk: '123',
                    stage: '456',
                },
                _current_version: 1,
                _etag: '123',
            };
            scope.action = 'edit';
            scope.publish = function() {
                return publish;
            };
            elem = $compile('<div sd-send-item data-item="item" data-orig="item" data-mode="authoring" ' +
                'data-action="action" data-publish="publish()"></div>')(scope);
            scope.$digest();
            iScope = elem.isolateScope();
            iScope.beforeSend = function() {
                return $q.when({});
            };
        }));

        it('can send and publish item to different desk', inject((
            authoring,
            $q,
            authoringWorkspace: AuthoringWorkspaceService,
        ) => {
            publish = true; // publish succeeds
            iScope.selectedDesk = selectedDesk;
            iScope.selectedStage = selectedStage;
            spyOn(authoring, 'open').and.returnValue($q.when(movedItem));
            spyOn(authoringWorkspace, 'close').and.returnValue($q.when(true));
            expect(iScope.orig.task.desk).toBe('123');
            expect(iScope.orig.task.stage).toBe('456');
            expect(iScope.orig._etag).toBe('123');
            iScope.sendAndPublish();
            iScope.$digest();
            expect(authoring.open).toHaveBeenCalledWith('foo', false);
            expect(authoringWorkspace.close).toHaveBeenCalledWith(false);
            expect(iScope.orig.task.desk).toBe(selectedDesk._id);
            expect(iScope.orig.task.stage).toBe(selectedStage._id);
            expect(iScope.orig._locked).toBe(true);
            expect(iScope.orig._etag).toBe('1111');
        }));

        it('can send and publish item to different desk publish fails',
            inject((authoring, $q, authoringWorkspace: AuthoringWorkspaceService, notify) => {
                publish = false; // publish succeeds
                iScope.selectedDesk = selectedDesk;
                iScope.selectedStage = selectedStage;
                spyOn(authoring, 'open').and.returnValue($q.when(movedItem));
                spyOn(authoringWorkspace, 'close').and.returnValue($q.when(true));
                expect(iScope.orig.task.desk).toBe('123');
                expect(iScope.orig.task.stage).toBe('456');
                expect(iScope.orig._etag).toBe('123');
                iScope.sendAndPublish();
                iScope.$digest();
                expect(authoring.open).toHaveBeenCalledWith('foo', false);
                expect(authoringWorkspace.close).not.toHaveBeenCalledWith(false);
                expect(iScope.orig.task.desk).toBe(selectedDesk._id);
                expect(iScope.orig.task.stage).toBe(selectedStage._id);
                expect(iScope.orig._locked).toBe(true);
                expect(iScope.orig._etag).toBe('1111');
            }));

        it('can send and publish item to different desk but locking failed',
            inject((authoring, $q, authoringWorkspace: AuthoringWorkspaceService, notify) => {
                publish = true; // publish succeeds
                movedItem._locked = false; // locked failed.
                iScope.selectedDesk = selectedDesk;
                iScope.selectedStage = selectedStage;
                spyOn(authoring, 'open').and.returnValue($q.when(movedItem));
                spyOn(authoringWorkspace, 'close').and.returnValue($q.when(true));
                spyOn(notify, 'error');
                expect(iScope.orig.task.desk).toBe('123');
                expect(iScope.orig.task.stage).toBe('456');
                expect(iScope.orig._etag).toBe('123');
                iScope.sendAndPublish();
                iScope.$digest();
                expect(authoring.open).toHaveBeenCalledWith('foo', false);
                expect(authoringWorkspace.close).not.toHaveBeenCalledWith(false);
                expect(iScope.orig.task.desk).toBe(selectedDesk._id);
                expect(iScope.orig.task.stage).toBe(selectedStage._id);
                expect(iScope.orig._locked).toBe(false);
                expect(iScope.orig._etag).toBe('1111');
                expect(notify.error).toHaveBeenCalledWith('Failed to send and publish.');
            }));
    });
});
