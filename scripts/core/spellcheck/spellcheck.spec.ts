
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

    beforeEach(window.module(($provide) => {
        $provide.constant('config', {server: {url: undefined}, iframely: {key: '123'}, editor: {}, features: {}});
    }));

    beforeEach(window.module('superdesk.apps.editor2'));
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
        inject((spellcheck, dictionaries, $q, $rootScope) => {
            var p = createParagraph('test what if foo bar baz');

            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors).toContain({word: 'test', index: 0, sentenceWord: true});
            expect(errors).toContain({word: 'if', index: 10, sentenceWord: false});
            expect(dictionaries.getActive).toHaveBeenCalledWith(LANG, 'en');
        }));

    it('can spellcheck using base dictionary',
        inject((spellcheck, dictionaries, $q, $rootScope) => {
            spellcheck.setLanguage('en');
            var p = createParagraph('test what if foo bar baz');

            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();

            expect(errors).toContain({word: 'test', index: 0, sentenceWord: true});
            expect(errors).toContain({word: 'if', index: 10, sentenceWord: false});
            expect(dictionaries.getActive).toHaveBeenCalledWith('en', null);
        }));

    it('can add words to user dictionary', inject((spellcheck, api, $rootScope) => {
        var p = createParagraph('Test');

        spyOn(api, 'save');
        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(1);

        spellcheck.addWordToUserDictionary('test');

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();

        expect(errors.length).toBe(0);
    }));

    it('can report error if paragraph starts with small letter', inject((spellcheck, api, $rootScope) => {
        // Test with existing words in dictionary
        var p = createParagraph('Foo what');

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(0);

        // now test if existing word starts with small letter.
        p = createParagraph('foo what');

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(1);
        expect(errors).toContain({word: 'foo', index: 0, sentenceWord: true});
    }));

    it('can report error if word comes after .|?|!|: (i.e, after : or at new sentence) starts with small letter',
        inject((spellcheck, api, $rootScope) => {
        // Test with existing words in dictionary
            var p = createParagraph('Foo what? Foo is foo. Foo is foo! What foo: Foo?');

            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(0);

            // now test if existing word comes after .|?|!|: starts with small letter.
            p = createParagraph('Foo what? foo is foo. foo is foo! what foo: foo?');

            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(4);
        }));

    it('can report if text contains multiple spaces', inject((spellcheck, api, $rootScope) => {
        // Test with existing words in dictionary
        var p = createParagraph('Foo what? Foo is foo.');

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(0);

        // now test if existing word comes after .|?|!|: starts with small letter.
        p = createParagraph('Foo  what? Foo is   foo.');

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(2);
    }));

    it('can report error for sentences beginning with any quotes and starts with small letter',
        inject((spellcheck, api, $rootScope) => {
        // Test with existing words in dictionary.
            var p = createParagraph('"Foo what."');

            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(0);

            // now test if existing word starts with small letter within quotes.
            p = createParagraph('"foo what."');
            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(1);
            expect(errors).toContain({word: 'foo', index: 1, sentenceWord: true});

            // now test if different variety of quote (“ ” or ' ') is used at beginning.
            p = createParagraph('“foo what.”');
            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(1);
            expect(errors).toContain({word: 'foo', index: 1, sentenceWord: true});

            p = createParagraph('\'foo what.\'');
            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(1);
            expect(errors).toContain({word: 'foo', index: 1, sentenceWord: true});
        }));

    it('can avoid reporting error if a valid word is in middle of sentence and starts with capital letter',
        inject((spellcheck, api, $rootScope) => {
            // Test with existing words in dictionary
            var p = createParagraph('Foo what, Foo is foo.');

            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(0);

            // now test if valid word, e.g. 'what' in middle of sentence starts with capital letter, i.e. 'What'.
            p = createParagraph('Foo What, Foo is foo.');

            spellcheck.errors(p).then(assignErrors);
            $rootScope.$digest();
            expect(errors.length).toBe(0);
        }));

    it('can suggest', inject((spellcheck, api, $q) => {
        spyOn(api, 'save').and.returnValue($q.when({}));
        spellcheck.suggest('test');
        expect(api.save).toHaveBeenCalledWith('spellcheck', {word: 'test', language_id: LANG});
    }));

    it('can reset dict when language is set to null', inject((spellcheck, $rootScope) => {
        spellcheck.setLanguage(null);
        var then = jasmine.createSpy('then');

        spellcheck.errors('test').then(then);
        $rootScope.$digest();
        expect(then).not.toHaveBeenCalled();
    }));

    it('can ignore word', inject((spellcheck, $rootScope, $location) => {
        $location.search('item', 'foo');
        var p = createParagraph('ignore errors');

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(2);

        spellcheck.ignoreWord('ignore');
        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(1);

        $location.search('item', 'bar');
        $rootScope.$digest();

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(2);

        $location.search('item', 'foo');
        $rootScope.$digest();

        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(1);

        $rootScope.$broadcast('item:unlock', {item: 'foo'});
        spellcheck.errors(p).then(assignErrors);
        $rootScope.$digest();
        expect(errors.length).toBe(2);
    }));

    it('can resolve abbreviations without language specified', inject((spellcheck, $rootScope) => {
        var spy = jasmine.createSpy('success');

        spellcheck.setLanguage('');
        spellcheck.getAbbreviationsDict().then(spy);
        $rootScope.$digest();
        expect(spy).toHaveBeenCalled();
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

    describe('spellcheck menu', () => {
        it('can toggle auto spellcheck',
            inject((editor, editorResolver, $controller, $rootScope, preferencesService) => {
                var $scope = $rootScope.$new();

                $scope.item = {language: 'en'};
                $scope.$digest();
                var ctrl = $controller('SpellcheckMenu', {$scope: $scope});

                expect(ctrl.isAuto).toBe(false);

                $rootScope.$digest();
                expect(ctrl.isAuto).toBe(true);
                expect(preferencesService.get).toHaveBeenCalledWith('spellchecker:status');

                ctrl.pushSettings();
                expect(editor.settings.spellcheck).toBe(true);
                expect(preferencesService.update).toHaveBeenCalled();

                ctrl.isAuto = false;
                ctrl.pushSettings();
                expect(editor.settings.spellcheck).toBe(false);
                expect(preferencesService.update).toHaveBeenCalled();

                spyOn(editor, 'render');
                ctrl.runSpellchecker();
                expect(editor.render).toHaveBeenCalled();
            }),
        );
    });
});
