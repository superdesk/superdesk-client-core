import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

describe('spellcheck', () => {
    var DICT = {
            what: 1,
            foo: 1,
            f1: 1,
            '3d': 1,
            is: 1,
            and: 1,
        },
        USER_DICT = {
            _id: 'baz',
            user: 'foo',
            content: {
                baz: 1,
            },
        },
        LANG = 'en-US',
        errors = [];

    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            server: {url: undefined, ws: undefined},
            iframely: {key: '123'},
            editor: {},
            features: {},
        };

        Object.assign(appConfig, testConfig);
    });

    beforeEach(window.module('superdesk.core.editor3'));
    beforeEach(window.module('superdesk.apps.spellcheck'));
    beforeEach(window.module('superdesk.core.preferences'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));

    beforeEach(inject((dictionaries, spellcheck, $q, preferencesService) => {
        spyOn(dictionaries, 'getActive').and.returnValue($q.when([
            {_id: 'foo', content: DICT},
            {_id: 'bar', content: {bar: 1}},
            USER_DICT,
        ]));

        spellcheck.setLanguage(LANG);
        spyOn(preferencesService, 'get').and.returnValue($q.when({enabled: true}));
        spyOn(preferencesService, 'update').and.returnValue($q.when({}));
    }));

    it('can spellcheck using multiple dictionaries',
        (done) => inject((spellcheck, dictionaries, $rootScope) => {
            var p = createParagraph('test what if foo bar baz');

            spellcheck.errors(p).then((errors) => {
                assignErrors(errors);

                expect(errors).toContain({word: 'test', index: 0, sentenceWord: true});
                expect(errors).toContain({word: 'if', index: 10, sentenceWord: false});
                expect(dictionaries.getActive).toHaveBeenCalledWith(LANG, 'en');

                done();
            });

            $rootScope.$digest();
        }));

    it('can spellcheck using base dictionary',
        (done) => inject((spellcheck, dictionaries, $q, $rootScope) => {
            spellcheck.setLanguage('en');
            var p = createParagraph('test what if foo bar baz');

            spellcheck.errors(p).then((errors) => {
                assignErrors(errors);

                expect(errors).toContain({word: 'test', index: 0, sentenceWord: true});
                expect(errors).toContain({word: 'if', index: 10, sentenceWord: false});
                expect(dictionaries.getActive).toHaveBeenCalledWith('en', null);

                done();
            });

            $rootScope.$digest();
        }));

    it('can add words to user dictionary', (done) => inject((spellcheck, api, $rootScope) => {
        var p = createParagraph('Test');

        spyOn(api, 'save');

        spellcheck.errors(p).then((_err) => {
            assignErrors(_err);

            expect(errors.length).toBe(1);

            spellcheck.addWordToUserDictionary('test');

            spellcheck.errors(p).then((_err2) => {
                assignErrors(_err2);
                expect(errors.length).toBe(0);

                done();
            });
        });

        $rootScope.$digest();
    }));

    it('can report error if paragraph starts with small letter', (done) => inject((spellcheck, $rootScope) => {
        // Test with existing words in dictionary
        var p = createParagraph('Foo what');

        spellcheck.errors(p).then((_err) => {
            assignErrors(_err);
            expect(errors.length).toBe(0);

            // now test if existing word starts with small letter.
            p = createParagraph('foo what');

            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);

                expect(errors.length).toBe(1);
                expect(errors).toContain({word: 'foo', index: 0, sentenceWord: true});

                done();
            });
        });

        $rootScope.$digest();
    }));

    it('can report error if word comes after .|?|!|: (i.e, after : or at new sentence) starts with small letter',
        (done) => inject((spellcheck, $rootScope) => {
            // Test with existing words in dictionary
            var p = createParagraph('Foo what? Foo is foo. Foo is foo! What foo: Foo?');

            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);
                expect(errors.length).toBe(0);

                // now test if existing word comes after .|?|!|: starts with small letter.
                p = createParagraph('Foo what? foo is foo. foo is foo! what foo: foo?');

                spellcheck.errors(p).then((_err) => {
                    assignErrors(_err);

                    expect(errors.length).toBe(4);

                    done();
                });
            });

            $rootScope.$digest();
        }));

    it('can report if text contains multiple spaces', (done) => inject((spellcheck, $rootScope) => {
        // Test with existing words in dictionary
        var p = createParagraph('Foo what? Foo is foo.');

        spellcheck.errors(p).then((_err) => {
            assignErrors(_err);
            expect(errors.length).toBe(0);

            // now test if existing word comes after .|?|!|: starts with small letter.
            p = createParagraph('Foo  what? Foo is   foo.');

            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);

                expect(errors.length).toBe(2);

                done();
            });
        });

        $rootScope.$digest();
    }));

    it('can report error for sentences beginning with any quotes and starts with small letter',
        (done) => inject((spellcheck, $rootScope) => {
            let promises = Promise.resolve();

            promises = promises.then(() => new Promise((resolve) => {
                // Test with existing words in dictionary.
                var p = createParagraph('"Foo what."');

                spellcheck.errors(p).then((_err) => {
                    assignErrors(_err);

                    expect(errors.length).toBe(0);

                    resolve();
                });

                $rootScope.$digest();
            }));

            promises = promises.then(() => new Promise((resolve) => {
                // now test if existing word starts with small letter within quotes.
                const p = createParagraph('"foo what."');

                spellcheck.errors(p).then((_err) => {
                    assignErrors(_err);
                    expect(errors.length).toBe(1);
                    expect(errors).toContain({word: 'foo', index: 1, sentenceWord: true});

                    resolve();
                });

                $rootScope.$digest();
            }));

            promises = promises.then(() => new Promise((resolve) => {
                // now test if different variety of quote (“ ” or ' ') is used at beginning.
                const p = createParagraph('“foo what.”');

                spellcheck.errors(p).then((_err) => {
                    assignErrors(_err);

                    expect(errors.length).toBe(1);
                    expect(errors).toContain({word: 'foo', index: 1, sentenceWord: true});

                    resolve();
                });

                $rootScope.$digest();
            }));

            promises = promises.then(() => new Promise((resolve) => {
                const p = createParagraph('\'foo what.\'');

                spellcheck.errors(p).then((_err) => {
                    assignErrors(_err);

                    expect(errors.length).toBe(1);
                    expect(errors).toContain({word: 'foo', index: 1, sentenceWord: true});

                    resolve();
                });

                $rootScope.$digest();
            }));

            promises = promises.then(() => {
                done();
            });
        }));

    it('can avoid reporting error if a valid word is in middle of sentence and starts with capital letter',
        (done) => inject((spellcheck, $rootScope) => {
            // Test with existing words in dictionary
            var p = createParagraph('Foo what, Foo is foo.');

            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);
                expect(errors.length).toBe(0);

                // now test if valid word, e.g. 'what' in middle of sentence starts with capital letter, i.e. 'What'.
                p = createParagraph('Foo What, Foo is foo.');

                spellcheck.errors(p).then((_err) => {
                    assignErrors(_err);
                    expect(errors.length).toBe(0);

                    done();
                });
            });
            $rootScope.$digest();
        }));

    it('can suggest', inject((spellcheck, api, $q) => {
        spyOn(api, 'save').and.returnValue($q.when({}));
        spellcheck.suggest('test');
        expect(api.save).toHaveBeenCalledWith('spellcheck', {word: 'test', language_id: LANG});
    }));

    it('can reset dict when language is set to null', (done) => inject((spellcheck, $rootScope) => {
        spellcheck.setLanguage(null);
        var then = jasmine.createSpy('then');

        spellcheck.errors('test').then(then);

        $rootScope.$digest();

        setTimeout(() => {
            expect(then).not.toHaveBeenCalled();

            done();
        }, 2000);
    }));

    it('can ignore word', (done) => inject((spellcheck, $rootScope, $location) => {
        $location.search('item', 'foo');

        const p = createParagraph('ignore errors');

        let promises = Promise.resolve();

        promises = promises.then(() => new Promise((resolve) => {
            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);
                expect(errors.length).toBe(2);

                resolve();
            });

            $rootScope.$digest();
        }));

        promises = promises.then(() => new Promise((resolve) => {
            spellcheck.ignoreWord('ignore');

            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);
                expect(errors.length).toBe(1);

                resolve();
            });

            $rootScope.$digest();
        }));

        promises = promises.then(() => new Promise((resolve) => {
            $location.search('item', 'bar');
            $rootScope.$digest();

            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);
                expect(errors.length).toBe(2);

                resolve();
            });

            $rootScope.$digest();
        }));

        promises = promises.then(() => new Promise((resolve) => {
            $location.search('item', 'foo');
            $rootScope.$digest();

            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);
                expect(errors.length).toBe(1);

                resolve();
            });

            $rootScope.$digest();
        }));

        promises = promises.then(() => new Promise((resolve) => {
            $rootScope.$broadcast('item:unlock', {item: 'foo'});
            spellcheck.errors(p).then((_err) => {
                assignErrors(_err);
                expect(errors.length).toBe(2);

                resolve();
            });
            $rootScope.$digest();
        }));

        promises = promises.then(() => {
            done();
        });
    }));

    it('can resolve abbreviations without language specified', (done) => inject((spellcheck, $rootScope) => {
        spellcheck.setLanguage('');
        spellcheck.getAbbreviationsDict().then(() => {
            done();
        });

        $rootScope.$digest();
    }));

    it('can cache active dictionaries for a language', inject((spellcheck, dictionaries, $rootScope) => {
        spellcheck.getDictionary('en');
        spellcheck.getDictionary('en');
        expect(dictionaries.getActive.calls.count()).toBe(1);
        spellcheck.getDictionary('cs');
        expect(dictionaries.getActive.calls.count()).toBe(2);
        $rootScope.$broadcast('dictionary:updated', {language: 'en'});
        spellcheck.getDictionary('en');
        expect(dictionaries.getActive.calls.count()).toBe(3);
        spellcheck.getDictionary('cs');
        expect(dictionaries.getActive.calls.count()).toBe(3);
        $rootScope.$broadcast('dictionary:created', {language: 'cs'});
        spellcheck.getDictionary('cs');
        expect(dictionaries.getActive.calls.count()).toBe(4);
    }));

    function assignErrors(_errors) {
        errors.splice(0, errors.length);
        errors.push(..._errors);
    }

    function createParagraph(text) {
        var p = document.createElement('p');

        p.contentEditable = 'true';
        p.innerHTML = text;
        document.body.appendChild(p);
        return p;
    }
});
