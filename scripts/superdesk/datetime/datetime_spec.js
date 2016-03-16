(function() {

    'use strict';

    describe('superdesk.datetime module', function() {

        beforeEach(module('superdesk.datetime'));

        describe('reldate filter', function() {
            it('can convert js Date into a string', inject(function($filter) {
                var date = new Date();
                expect($filter('reldate')(date)).toBe('a few seconds ago');
            }));
        });

        describe('time filter', function() {
            it('can convert date into time str', inject(function($filter) {
                var date = new Date(2010, 10, 10, 8, 5, 35);
                expect($filter('time')(date)).toBe('8:05');
            }));
        });

        describe('datetime service', function() {
            it('can short format datetime', inject(function(datetime, moment) {
                var now = moment();
                var day = now.isoWeekday();

                expect(now.format('hh:mm')).toBe(datetime.shortFormat(now.format()));

                // on monday do tuesday, otherwise day before
                var week = day === 1 ? now.add(1, 'days') : now.subtract(1, 'days');
                expect(week.format('dddd, hh:mm')).toBe(datetime.shortFormat(week.format()));

                var next = now.add(8, 'days');
                expect(next.format('MM/DD')).toBe(datetime.shortFormat(next.format()));
            }));

            it('can long format datetime', inject(function(datetime, moment) {
                var now = moment();
                expect(now.format('LLL')).toBe(datetime.longFormat(now.format()));
            }));
        });
    });

})();
