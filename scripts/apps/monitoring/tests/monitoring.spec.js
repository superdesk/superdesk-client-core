describe('monitoring', () => {
    beforeEach(window.module('superdesk.apps.monitoring'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    it('can switch between list and swimlane view', inject(($controller, $rootScope, storage, config) => {
        config.features = {
            swimlane: {columnsLimit: 4}
        };

        var scope = $rootScope.$new(),
            ctrl = $controller('Monitoring', {$scope: scope});

        expect(ctrl.hasSwimlaneView).toBe(1);

        // Default will be list view
        storage.clear();
        expect(ctrl.viewColumn).toBe(null); // no swimlane
        // display all groups for list view, i.e. limitTo: null when no swimlane
        expect(ctrl.columnsLimit).toBe(null);

        // Switch to swimlane view, via switch view button or returning back to monitoring
        // view while swimlane view was already ON
        ctrl.switchView(true);
        expect(storage.getItem('displaySwimlane')).toBe(true);
        expect(ctrl.viewColumn).toBe(true); // swimlane
        expect(ctrl.columnsLimit).toBe(4);

        // Switch back to list view
        ctrl.switchView(false);
        expect(storage.getItem('displaySwimlane')).toBe(false);
        expect(ctrl.viewColumn).toBe(false);
        expect(ctrl.columnsLimit).toBe(null);
    }));

    it('can preview an item', inject(($controller, $rootScope) => {
        var scope = $rootScope.$new(),
            ctrl = $controller('Monitoring', {$scope: scope}),
            item = {};

        expect(ctrl.state['with-preview']).toBeFalsy();

        ctrl.preview(item);

        expect(ctrl.previewItem).toBe(item);
        expect(ctrl.state['with-preview']).toBeTruthy();

        ctrl.closePreview();
        expect(ctrl.previewItem).toBe(null);
        expect(ctrl.state['with-preview']).toBeFalsy();
    }));

    it('can hide history tabs when preview externalsource item', inject(($controller, $rootScope) => {
        var scope = $rootScope.$new(),
            ctrl = $controller('Monitoring', {$scope: scope}),
            item = {};

        expect(ctrl.state['with-preview']).toBeFalsy();

        ctrl.preview(item);

        expect(ctrl.previewItem).toBe(item);
        expect(ctrl.state['with-preview']).toBeTruthy();
        expect(ctrl.showHistoryTab).toBeTruthy();

        item._type = 'externalsource';
        ctrl.preview(item);

        expect(ctrl.previewItem).toBe(item);
        expect(ctrl.showHistoryTab).toBeFalsy();
    }));

    it('can edit item', inject(($controller, $rootScope, session) => {
        session.identity = {_id: 'foo'};
        var scope = $rootScope.$new(),
            ctrl = $controller('Monitoring', {$scope: scope}),
            item = {};

        expect(ctrl.state['with-authoring']).toBeFalsy();

        ctrl.edit(item);
        expect(ctrl.editItem).toBe(item);
        expect(ctrl.state['with-authoring']).toBeTruthy();
    }));

    describe('cards service', () => {
        beforeEach(inject((desks) => {
            desks.deskLookup = {1: {_id: 1, name: 'desk1', desk_type: 'authoring'}};
            desks.stageLookup = {123: {default_incoming: false}, 456: {default_incoming: true}};
        }));

        it('can get criteria for stage', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {_id: '123'};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.filter.and).toContain({
                term: {'task.stage': card._id}
            });

            criteria = cards.criteria(card, 'foo');
            expect(criteria.source.query.filtered.filter.and).toContain({
                query: {query_string: {query: 'foo', lenient: false}}
            });
        }));

        it('can get criteria for personal', inject((cards, session) => {
            var card = {type: 'personal'};

            session.identity = {_id: 'foo'};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.filter.and).toContain({
                bool: {
                    must: {term: {original_creator: session.identity._id}},
                    must_not: {exists: {field: 'task.desk'}}
                }
            });
        }));

        it('can get criteria for saved search', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {type: 'search', search: {filter: {query: {q: 'foo'}}}};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.query.query_string.query).toBe('foo');
        }));

        it('can get criteria for spike desk', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {type: 'spike'};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.filter.and).toContain({
                term: {'task.desk': card._id}
            });
            expect(criteria.source.query.filtered.filter.and).toContain({
                term: {state: 'spiked'}
            });
        }));

        it('can get criteria for highlight', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {type: 'highlights'};
            var queryParam = {highlight: '123'};
            var criteria = cards.criteria(card, null, queryParam);

            expect(criteria.source.query.filtered.filter.and).toContain({
                and: [{term: {highlights: queryParam.highlight}}]
            });
        }));

        it('can get criteria for stage with search', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {_id: '123', query: 'test'};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.query.query_string.query).toBe('test');
        }));

        it('can get criteria for personal with search', inject((cards, session) => {
            var card = {type: 'personal', query: 'test'};

            session.identity = {_id: 'foo'};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.query.query_string.query).toBe('test');
        }));

        it('can get criteria for spike with search', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {_id: '123', type: 'spike', query: 'test'};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.query.query_string.query).toBe('test');
        }));

        it('can get criteria for highlight with search', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {type: 'highlights', query: 'test'};
            var queryParam = {highlight: '123'};
            var criteria = cards.criteria(card, null, queryParam);

            expect(criteria.source.query.filtered.query.query_string.query).toBe('test');
        }));

        it('can get criteria for file type filter', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {_id: '123', fileType: JSON.stringify(['text'])};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.filter.and).toContain({
                terms: {type: ['text']}
            });
        }));

        it('can get criteria for saved search with search', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {_id: '123', type: 'search', query: 'test',
                search: {filter: {query: {q: 'foo', type: '[\"picture\"]'}}}
            };
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.query.query_string.query).toBe('(test) foo');
            expect(criteria.source.post_filter.and).toContain({terms: {type: ['picture']}});
        }));

        it('can get criteria for file type filter with search', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {_id: '123', fileType: JSON.stringify(['text']), query: 'test'};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.filter.and).toContain({
                terms: {type: ['text']}
            });
        }));

        it('can get criteria for multiple file type filter', inject((cards, session) => {
            session.identity = {_id: 'foo'};
            var card = {_id: '123', fileType: JSON.stringify(['text', 'picture'])};
            var criteria = cards.criteria(card);

            expect(criteria.source.query.filtered.filter.and).toContain({
                terms: {type: ['text', 'picture']}
            });
        }));
    });

    describe('monitoring group directive', () => {
        beforeEach(window.module('superdesk.templates-cache'));
        beforeEach(window.module('superdesk.apps.searchProviders'));
        beforeEach(window.module('superdesk.core.services.pageTitle'));

        beforeEach(inject(($templateCache) => {
            // change template not to require aggregate config but rather render single group
            $templateCache.put('scripts/apps/monitoring/views/monitoring-view.html',
                '<div id="group" sd-monitoring-group data-group="{type: \'stage\', _id: \'foo\'}"></div>');
        }));

        it('can update items on item:move event',
            inject(($rootScope, $compile, $q, api, $timeout, session) => {
                session.identity = {_id: 'foo'};
                var scope = $rootScope.$new();

                $compile('<div sd-monitoring-view></div>')(scope);
                scope.$digest();

                spyOn(api, 'query').and.returnValue($q.when({_items: [], _meta: {total: 0}}));

                scope.$broadcast('item:move', {from_stage: 'bar', to_stage: 'bar'});
                scope.$digest();
                $timeout.flush(500);
                expect(api.query).not.toHaveBeenCalled();

                scope.$broadcast('item:move', {from_stage: 'bar', to_stage: 'foo'});
                scope.$digest();
                $timeout.flush(2000);
                expect(api.query).toHaveBeenCalled();
            }));

        it('updates custom search on item preview',
            inject(($rootScope, $compile, search, api, session, $q, $timeout, $templateCache) => {
                $templateCache.put('scripts/apps/monitoring/views/monitoring-view.html',
                    '<div id="group" sd-monitoring-group ' +
                    'data-group="{type: \'search\', search: {filter: {query: \'\'}}}"></div>');

                var scope = $rootScope.$new();

                $compile('<div sd-monitoring-view></div>')(scope);

                session.identity = {_id: 'foo'};
                scope.$digest();
                $timeout.flush(2000);

                spyOn(api, 'query').and.returnValue($q.when({_items: [], _meta: {total: 0}}));
                spyOn(search, 'mergeItems');

                session.identity = {_id: 'foo'};
                scope.$broadcast('ingest:update', {});
                scope.$digest();
                $timeout.flush(2000);
                expect(search.mergeItems).toHaveBeenCalled();
            })
        );

        it('can edit non spiked item', inject(($controller, $rootScope, $compile, authoringWorkspace, session) => {
            session.identity = {_id: 'foo'};
            var scope = $rootScope.$new(),
                $elm = $compile('<div sd-monitoring-view></div>')(scope);

            scope.$digest();
            spyOn(authoringWorkspace, 'edit');

            var sdGroupElement = $elm.find('#group'),
                iScope = sdGroupElement.isolateScope(),
                item1 = {state: 'spiked'},
                item2 = {state: 'fetched'};

            iScope.edit(item1, true);
            expect(authoringWorkspace.edit).not.toHaveBeenCalled();

            iScope.edit(item2, true);
            expect(authoringWorkspace.edit).toHaveBeenCalled();
        }));
    });

    describe('desk notification directive', () => {
        beforeEach(window.module('superdesk.templates-cache'));

        beforeEach(inject((desks, api, $q) => {
            desks.stageLookup = {1: {desk: 'desk1', default_incoming: true}};
            desks.userLookup = {1: {display_name: 'user1'}};
            spyOn(api, 'activity').and.returnValue($q.when({_items: []}));
        }));

        it('can initiate the desk notifications',
            inject(($rootScope, $compile, deskNotifications) => {
                var scope = $rootScope.$new();

                var notifications = [{
                    name: 'desk:mention',
                    recipients: [{desk_id: 'desk1', read: false}],
                    data: {comment: 'abc', comment_id: 1}}];

                spyOn(deskNotifications, 'getNotifications').and.returnValue(notifications);
                spyOn(deskNotifications, 'getUnreadCount').and.returnValue(1);

                var elem = $compile('<div sd-desk-notifications data-stage="1"></div>')(scope);

                scope.$digest();
                expect(deskNotifications.getNotifications).toHaveBeenCalled();

                var iScope = elem.isolateScope();

                expect(iScope.notificationCount).toBe(1);
            }));
    });
});
