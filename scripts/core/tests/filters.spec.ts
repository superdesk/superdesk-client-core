
describe('superdesk filters', () => {
    beforeEach(window.module('superdesk.core.datetime'));
    beforeEach(window.module('superdesk.core.filters'));

    describe('sort items', () => {
        it('can ignore case while sorting', inject((sortByNameFilter) => {
            var unorderedList = [{name: 'c'}, {name: 'A'}, {name: 'b'}];

            expect(sortByNameFilter(unorderedList)).toEqual([{name: 'A'}, {name: 'b'}, {name: 'c'}]);
        }));

        it('can sort on a different property and ignore case while sorting', inject((sortByNameFilter) => {
            var unorderedList = [{name: 'c', display_name: 'category'}, {name: 'A', display_name: 'ANPA Categories'},
                {name: 'b', display_name: 'broadcast'}];

            expect(sortByNameFilter(unorderedList, 'display_name')).toEqual([
                {name: 'A', display_name: 'ANPA Categories'}, {name: 'b', display_name: 'broadcast'},
                {name: 'c', display_name: 'category'}]);
        }));

        it('days in month', inject((daysInAMonthFilter) => {
            var jan = daysInAMonthFilter(0);

            expect(jan.length).toEqual(31);
            expect(jan[jan.length - 1]).toEqual('31');

            var feb = daysInAMonthFilter(1);

            expect(feb.length).toBeGreaterThanOrEqual(28);
        }));
    });
});
