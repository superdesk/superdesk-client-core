(function() {

    'use strict';

    describe('superdesk.datetime module', function() {

        beforeEach(module('superdesk.mocks'));
        beforeEach(module('superdesk.datetime'));

        describe('reldate filter', function() {
            it('can convert js Date into a string', inject(function($filter) {
                var date = new Date();
                expect($filter('reldate')(date)).toBe('a few seconds ago');
            }));
        });

        describe('time filter', function() {
            it('can convert model time into time str', inject(function($filter) {
                expect($filter('time')('08:05:35')).toBe('8:05');
            }));
        });

        describe('datetime service', function() {
            it('can short format datetime', inject(function(datetime, moment) {
                var now = moment();
                var day = now.isoWeekday();

                expect(now.format('HH:mm')).toBe(datetime.shortFormat(now.format()));

                // on monday do tuesday, otherwise day before
                var week = day === 1 ? now.add(1, 'days') : now.subtract(1, 'days');
                expect(week.format('dddd, HH:mm')).toBe(datetime.shortFormat(week.format()));

                var next = now.add(8, 'days');
                expect(next.format('MM/DD')).toBe(datetime.shortFormat(next.format()));
            }));

            it('can long format datetime', inject(function(datetime, moment) {
                var now = moment();
                expect(now.format('LLL')).toBe(datetime.longFormat(now.format()));
            }));
        });

        describe('datetime helper service', function() {
            it('can merge date time and tz', inject(function(datetimeHelper) {
                var merged = datetimeHelper.mergeDateTime('19/04/2016', '15:36:00', 'Europe/Prague');
                expect(merged).toBe('2016-04-19T15:36:00');
            }));
        });

        describe('default shortTimeFormat config', function() {
            it('shortTimeFormat is in 24h format', inject(function(config) {
                expect(config.shortTimeFormat).toBeDefined();
                expect(config.shortTimeFormat).toEqual('HH:mm');
            }));
        });
    });
})();
