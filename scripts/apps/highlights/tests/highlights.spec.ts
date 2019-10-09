
describe('highlights', () => {
    beforeEach(window.module('superdesk.apps.highlights'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.extension-points'));

    xdescribe('sdPackageHighlightsDropdown directive', () => {
        var scope, desk;

        beforeEach(inject((desks, highlightsService, $rootScope, $compile, $q) => {
            desk = {_id: '123'};
            desks.setCurrentDeskId(desk._id);

            spyOn(highlightsService, 'get').and.returnValue($q.when({_items: [
                {_id: '1', name: 'Spotlight'},
                {_id: '2', name: 'New'},
            ]}));

            scope = $rootScope.$new();
            $compile('<div dropdown sd-package-highlights-dropdown></div>')(scope);
            scope.$digest();
        }));

        it('can set highlights', inject((desks, highlightsService, $q, $rootScope) => {
            var active = desks.active;

            expect(active.desk).toEqual('123');
            $rootScope.$digest();
            expect(highlightsService.get).toHaveBeenCalledWith(active.desk);
        }));
    });

    describe('create highlights button directive', () => {
        it('can create highlights package',
            inject(($compile, $rootScope, $q, api, authoring) => {
                var scope = $rootScope.$new();
                var elem = $compile('<div sd-create-highlights-button highlight="\'foo\'"></div>')(scope);

                scope.$digest();
                var iscope = elem.isolateScope();

                var highlight = {_id: 'foo_highlight', name: 'Foo', task: {desk: '123'}};
                var pkg = {_id: 'foo_package'};

                spyOn(api, 'find').and.returnValue($q.when(highlight));
                spyOn(api, 'save').and.returnValue($q.when(pkg));
                spyOn(authoring, 'open').and.returnValue($q.when(pkg));

                iscope.createHighlight();
                $rootScope.$digest();
                expect(api.find).toHaveBeenCalledWith('highlights', 'foo');
                expect(api.save).toHaveBeenCalledWith('archive',
                    jasmine.objectContaining({headline: 'Foo', highlight: 'foo_highlight'}));
            }));
    });

    describe('highlights service', () => {
        it('can mark item for highlights', inject((highlightsService, api, $q) => {
            spyOn(api, 'save').and.returnValue($q.when({}));
            highlightsService.markItem('h1', {_id: 'id', guid: 'guid'});
            expect(api.save).toHaveBeenCalledWith('marked_for_highlights', {highlights: 'h1', marked_item: 'id'});
        }));

        it('can save highlights configuration', inject((highlightsService, api, $q) => {
            spyOn(api.highlights, 'save').and.returnValue($q.when({}));
            var config = {};
            var configEdit = {
                auto_insert: 'now/d',
                desks: [],
                groups: ['main'],
                name: 'Today highlight',
            };

            highlightsService.saveConfig(config, configEdit);
            expect(api.highlights.save).toHaveBeenCalledWith(config, configEdit);
        }));

        it('can remove highlights configuration', inject((highlightsService, api, $q) => {
            spyOn(api.highlights, 'remove').and.returnValue($q.when({}));
            var config = {
                _id: '123456',
                auto_insert: 'now/d',
                desks: [],
                groups: ['main'],
                name: 'Today highlight',
            };

            highlightsService.removeConfig(config);
            expect(api.highlights.remove).toHaveBeenCalledWith(config);
        }));

        it('timedelta is in item auto_insert date range', inject((highlightsService, api, $q) => {
            var post = {
                auto_insert: 'now-1h',
                desks: [],
                groups: ['main'],
                name: 'Hourly highlight',
            };

            expect(highlightsService.isInDateRange(post, 0)).toEqual(true);
            expect(highlightsService.isInDateRange(post, 0.5)).toEqual(true);
            expect(highlightsService.isInDateRange(post, 2)).toEqual(false);
        }));
    });
});
