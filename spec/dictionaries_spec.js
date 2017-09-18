
var nav = require('./helpers/utils').nav,
    dictionaries = require('./helpers/dictionaries');

describe('dictionaries', () => {
    describe('add dictionary', () => {
        beforeEach(() => {
            nav('/settings/dictionaries');
        });

        it('add dictionary', () => {
            dictionaries.addDictionary();
            dictionaries.setName('Test');
            dictionaries.setLanguageId('en');
            dictionaries.save();
            expect(dictionaries.getRow('Test').count()).toBe(1);
        });

        it('add dictionary', () => {
            dictionaries.addPersonalDictionary();
            dictionaries.setLanguageId('en');
            dictionaries.save();
            expect(dictionaries.getPersonalRow('en').isPresent()).toBe(true);
        });
    });

    describe('edit dictionary', () => {
        beforeEach(() => {
            nav('/settings/dictionaries');
        });

        it('change dictionary name', () => {
            dictionaries.edit('Test 1');
            dictionaries.setName('Test 2');
            dictionaries.save();
            expect(dictionaries.getRow('Test 2').count()).toBe(1);
            expect(dictionaries.getRow('Test 1').count()).toBe(0);
        });

        it('add/remove word in dictionary', () => {
            dictionaries.edit('Test 1');
            dictionaries.search('theta');
            expect(dictionaries.getWordsCount()).toBe(0);
            dictionaries.saveWord();
            expect(dictionaries.getWordsCount()).toBe(1);
            dictionaries.removeWord();
            expect(dictionaries.getWordsCount()).toBe(0);
        });
    });

    describe('delete dictionary', () => {
        beforeEach(() => {
            nav('/settings/dictionaries');
        });

        it('delete dictionary', () => {
            expect(dictionaries.getRow('Test 1').count()).toBe(1);
            dictionaries.remove('Test 1');
            expect(dictionaries.getRow('Test 1').count()).toBe(0);
        });
    });
});
