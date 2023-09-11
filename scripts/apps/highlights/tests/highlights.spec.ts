
describe('highlights', () => {
    beforeEach(window.module('superdesk.apps.highlights'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    describe('highlights service', () => {
        it('can mark item for highlights', inject((highlightsService, api, $q) => {
            spyOn(api, 'save').and.returnValue($q.when({}));
            highlightsService.markItem('h1', {_id: 'id', guid: 'guid'});
            expect(api.save).toHaveBeenCalledWith('marked_for_highlights', {highlights: ['h1'], marked_item: 'id'});
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
