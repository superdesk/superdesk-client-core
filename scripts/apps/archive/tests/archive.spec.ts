
import {DuplicateController} from '../controllers';
import {registerTestExtensions} from 'core/tests/helpers/register-test-extensions';

describe('content', () => {
    var item: any = {_id: 1};

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.authoring'));

    beforeEach(window.module(($provide) => {
        $provide.constant('config', {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY',
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY',
            },
            defaultTimezone: 'Europe/London',
            server: {url: undefined},
        });
    }));

    it('can spike items', inject((spike, api, $q) => {
        spyOn(api, 'update').and.returnValue($q.when());
        spike.spike(item);
        expect(api.update).toHaveBeenCalledWith('archive_spike', item, {state: 'spiked'});
    }));

    it('can unspike items', inject((spike, api, send, $q, $rootScope) => {
        var config = {desk: 'foo', stage: 'working'};

        spyOn(api, 'update').and.returnValue($q.when());
        spyOn(send, 'startConfig').and.returnValue($q.when(config));
        spike.unspike(item);
        $rootScope.$digest();
        expect(api.update).toHaveBeenCalledWith('archive_unspike', item, {task: config});
    }));

    it('onSpike middleware is called',
        (done) => inject((superdesk, activityService, privileges, modal) => {
            const extensionDelay = 200;

            const articleEntities = {
                onSpike: () => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({});
                        }, extensionDelay);
                    });
                },
            };

            spyOn(articleEntities, 'onSpike').and.callThrough();
            spyOn(modal, 'createCustomModal').and.callThrough(); // called after middlewares

            registerTestExtensions(
                [
                    {
                        activate: () => {
                            return Promise.resolve({
                                contributions: {
                                    entities: {
                                        article: articleEntities,
                                    },
                                },
                            });
                        },
                    },
                ],
                superdesk,
                modal,
                privileges,
            ).then(() => {
                activityService.start(superdesk.activities.spike, {data: {item: {_id: '0'}}});

                setTimeout(() => {
                    expect(articleEntities.onSpike).toHaveBeenCalled();
                });

                setTimeout(() => {
                    expect(modal.createCustomModal).not.toHaveBeenCalled();
                }, extensionDelay - 50);

                setTimeout(() => {
                    expect(modal.createCustomModal).toHaveBeenCalled();
                    done();
                }, extensionDelay + 50);
            });
        }));

    describe('archive service', () => {
        beforeEach(inject((desks, session, preferencesService) => {
            session.identity = {_id: 'user:1'};

            spyOn(preferencesService, 'update').and.returnValue(true);

            desks.userDesks = {_items: [{_id: '1', name: 'sport', working_stage: '2', incoming_stage: '3'},
                {_id: '2', name: 'news', working_stage: '4', incoming_stage: '5'}]};
            desks.setCurrentDeskId('2');

            item = {_id: '123'};
        }));

        it('can add an item to personal workspace', inject(($location, archiveService, desks) => {
            spyOn(desks, 'getCurrentDesk').and.returnValue({_id: '2', working_stage: '4'});
            $location.path('/workspace/personal');
            archiveService.addTaskToArticle(item);
            expect(item.task).not.toBeDefined();
        }));

        it('can add an item to user\'s active desk', inject((archiveService, desks) => {
            spyOn(desks, 'getCurrentDesk').and.returnValue({_id: '2', working_stage: '4'});
            archiveService.addTaskToArticle(item);
            expect(item.task.desk).toBe('2');
            expect(item.task.stage).toBe('4');
        }));

        it('can add an item to a desk', inject((archiveService, desks) => {
            archiveService.addTaskToArticle(item, desks.userDesks._items[0]);

            expect(item.task.desk).toBe('1');
            expect(item.task.stage).toBe('2');
        }));

        it('verifies if item is from Legal Archive or not', inject((archiveService) => {
            expect(archiveService.isLegal(item)).toBe(false);

            item._type = 'legal_archive';
            expect(archiveService.isLegal(item)).toBe(true);
        }));

        it('verifies if item is from Archived repo or not', inject((archiveService) => {
            expect(archiveService.isArchived(item)).toBe(false);

            item._type = 'archived';
            expect(archiveService.isArchived(item)).toBe(true);
        }));

        it('returns the related items', inject((archiveService, api, $q) => {
            spyOn(api, 'query').and.returnValue($q.when());
            archiveService.getRelatedItems({slugline: 'test'});
            expect(api.query).toHaveBeenCalled();
            var criteria = api.query.calls.mostRecent().args[1];

            expect(criteria.source.query.filtered.query.query_string.query).toBe('slugline.phrase:"test"');
        }));

        it('can verify if the item is published or not', inject((archiveService) => {
            item.state = 'submitted';
            expect(archiveService.isPublished(item)).toBe(false);

            item.state = 'corrected';
            expect(archiveService.isPublished(item)).toBe(true);
        }));

        it('return type based on state and repository', inject((archiveService) => {
            item.state = 'spiked';
            expect(archiveService.getType(item)).toBe('spike');

            item.state = 'ingested';
            expect(archiveService.getType(item)).toBe('ingest');

            item.state = 'submitted';
            expect(archiveService.getType(item)).toBe('archive');

            item._type = 'archived';
            item.state = 'published';
            expect(archiveService.getType(item)).toBe('archived');

            item._type = 'published';
            expect(archiveService.getType(item)).toBe('archive');

            item._type = 'legal_archive';
            expect(archiveService.getType(item)).toBe('legal_archive');

            item._type = 'externalsource';
            expect(archiveService.getType(item)).toBe('externalsource');
        }));

        it('can fetch version history', inject((archiveService, api, $q) => {
            spyOn(api, 'find').and.returnValue($q.when());
            spyOn(api.legal_archive_versions, 'getByUrl').and.returnValue($q.when());

            item._links = {_id: '123'};
            archiveService.getVersions(item, {}, 'versions');
            expect(api.find).toHaveBeenCalledWith('archive', '123',
                {version: 'all', embedded: {user: 1}, max_results: 200});

            item._type = 'legal_archive';
            item._links = {collection: {href: '/legal_archive'}};
            archiveService.getVersions(item, {}, 'versions');
            expect(api.find).toHaveBeenCalledWith('legal_archive', '123', {version: 'all', max_results: 200});
        }));
    });

    describe('multi service', () => {
        it('can reset on route change', inject((multi, $rootScope) => {
            multi.toggle({_id: 1, selected: true});
            expect(multi.count).toBe(1);
            expect(multi.getIds()).toEqual([1]);

            $rootScope.$broadcast('$routeChangeStart');
            $rootScope.$digest();

            expect(multi.count).toBe(0);
        }));

        it('can get list of items', inject((multi) => {
            var items = [{_id: 1, selected: true}, {_id: 2, selected: true}];

            multi.toggle(items[0]);
            multi.toggle(items[1]);
            expect(multi.getItems()).toEqual(items);
        }));

        it('can check if item is selected', inject((multi) => {
            var items = [{_id: 1, selected: true}];

            multi.toggle(items[0]);
            expect(multi.isSelected(items[0])).toEqual(true);
            expect(multi.isSelected({_id: 2})).toEqual(false);
        }));
    });

    describe('media-related directive', () => {
        it('can view item', inject((familyService, $rootScope, $compile, superdesk, $q) => {
            var scope = $rootScope.$new();

            scope.item = {_id: 1, family_id: 1};
            scope.relatedItems = {_items: [{_id: 2, family_id: 1}]};

            let html = '<div sd-media-related data-item="item" data-related-items="relatedItems"></div>';
            var elem = $compile(html)(scope);

            scope.$digest();

            var iscope = elem.isolateScope();

            expect(iscope.item).toBe(scope.item);

            spyOn(superdesk, 'intent').and.returnValue($q.when());
            iscope.open(scope.relatedItems._items[0]);
            scope.$apply();

            expect(superdesk.intent).toHaveBeenCalledWith('view', 'item', scope.relatedItems._items[0]);
        }));
    });

    describe('item preview container', () => {
        it('can handle preview:item intent', inject(($rootScope, $compile, superdesk) => {
            var scope = $rootScope.$new();
            var elem = $compile('<div sd-item-preview-container></div>')(scope);

            scope.$digest();

            var iscope = elem.isolateScope();

            expect(iscope.item).toBe(null);

            scope.$apply(() => {
                superdesk.intent('preview', 'item', item);
            });

            expect(iscope.item).toBe(item);

            iscope.close();
            expect(iscope.item).toBe(null);
        }));
    });

    describe('item preview header', () => {
        it('on toggle sets the header state in local storage', inject(($rootScope, $compile, storage) => {
            storage.clear();
            var firstScope = $rootScope.$new();

            firstScope.selected = {preview: item};
            $compile('<div sd-media-preview></div>')(firstScope);
            firstScope.$digest();

            const expectValues = (directiveScope, value) => {
                expect(directiveScope.previewState.toggleHeader).toBe(value);
                expect(storage.getItem('item_preview:header_state')).toBe(value);
            };

            expectValues(firstScope, false);
            firstScope.togglePreviewHeader();
            expectValues(firstScope, true);

            var secondScope = $rootScope.$new();

            secondScope.selected = {preview: item};
            $compile('<div sd-media-preview></div>')(secondScope);
            expectValues(secondScope, true);
        }));
    });

    describe('duplicate', () => {
        it('can duplicate item to current desk', inject(($controller, desks, workspaces, session, api, $q) => {
            spyOn(workspaces, 'isCustom').and.returnValue(true);
            spyOn(desks, 'getCurrentDeskId').and.returnValue('sports');
            spyOn(api, 'save').and.returnValue($q.when({}));
            session.identity = {};

            let data = {item: {item_id: 'foo', _type: 'archive', task: {}}};

            $controller(DuplicateController, {data: data});

            expect(api.save).toHaveBeenCalledWith('duplicate', {}, {
                desk: 'sports',
                type: 'archive',
                item_id: 'foo',
            }, data.item);
        }));
    });

    it('spike action prompts user if item has unsaved changes',
        (done) => inject((activityService, superdesk, autosave, confirm, $q, $rootScope, spike, modal) => {
            const itemObject = {_id: 'foo', lock_user: 'foo'};

            spyOn(autosave, 'get').and.returnValue($q.when());
            spyOn(confirm, 'reopen').and.returnValue($q.reject());
            spyOn(modal, 'createCustomModal').and.returnValue($q.when());

            activityService.start(superdesk.activities.spike, {data: {item: itemObject}});
            $rootScope.$digest();

            setTimeout(() => {
                expect(autosave.get).toHaveBeenCalled();
                expect(confirm.reopen).toHaveBeenCalled();
                expect(modal.createCustomModal).toHaveBeenCalled();
                done();
            }, 1000);
        }));
});
