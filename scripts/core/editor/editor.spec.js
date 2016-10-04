'use strict';

describe('text editor', function() {

    beforeEach(window.module('superdesk.publish'));
    beforeEach(window.module('superdesk.editor'));
    beforeEach(window.module('superdesk.editor.spellcheck'));
    beforeEach(window.module('superdesk.templates-cache'));

    beforeEach(function() {
        // remove all elements from body
        document.body = document.createElement('body');
    });

    function createScope(text, $rootScope) {
        var scope = $rootScope.$new();
        scope.node = document.createElement('p');
        scope.node.innerHTML = text;
        scope.model = {
            $viewValue: text,
            $setViewValue: function(value) {
                this.$viewValue = value;
            }
        };
        scope.medium = {
            exportSelection: function() {
                return {start: 0, end: 0};
            },
            importSelection: function(pos) {
                return;
            }
        };
        document.body.appendChild(scope.node);
        spyOn(scope.model, '$setViewValue').and.callThrough();
        return scope;
    }

    it('can spellcheck', inject(function(editor, spellcheck, $q, $rootScope) {
        editor.setSettings({spellcheck: true});
        spyOn(spellcheck, 'errors').and.returnValue($q.when([{word: 'test', index: 0}]));
        var scope = createScope('test', $rootScope);
        editor.registerScope(scope);
        editor.renderScope(scope);
        $rootScope.$digest();

        expect(scope.node.innerHTML).toBe('<span class="sderror sdhilite">test</span>');
    }));

    it('can highlight a sentence word for capitalization', inject(function(editor, spellcheck, $q, $rootScope) {
        editor.setSettings({spellcheck: true});
        spyOn(spellcheck, 'errors').and.returnValue($q.when([{word: 'test', index: 0, sentenceWord: true}]));
        var scope = createScope('test', $rootScope);
        editor.registerScope(scope);
        editor.renderScope(scope);
        $rootScope.$digest();

        expect(scope.node.innerHTML).toBe('<span class="sderror sdhilite sdCapitalize">test</span>');
    }));

    it('can remove highlights but keep marker', inject(function(editor, $q, $rootScope) {
        editor.setSettings({spellcheck: true});
        var content = 'test <b>foo</b> <span class="sderror sdhilite">error</span> it';
        var scope = createScope(content, $rootScope);
        var html = editor.cleanScope(scope);
        expect(html).toBe('test <b>foo</b> error it');
    }));

    it('can findreplace', inject(function(editor, spellcheck, $q, $rootScope, $timeout) {
        editor.setSettings({spellcheck: true});
        spyOn(spellcheck, 'errors').and.returnValue($q.when([{word: 'test', index: 0}]));
        var scope = createScope('test $foo and $foo', $rootScope);
        editor.registerScope(scope);

        var diff = {};
        diff.bar = '';
        diff.$foo = '';
        editor.setSettings({findreplace: {diff: diff}});
        editor.render();
        $timeout.flush();

        $rootScope.$digest();
        var foo = '<span class="sdfindreplace sdhilite">$foo</span>';
        var fooActive = '<span class="sdfindreplace sdhilite sdactive">$foo</span>';
        expect(scope.node.innerHTML).toBe('test ' + fooActive + ' and ' + foo);

        editor.selectNext();
        expect(scope.node.innerHTML).toBe('test ' + foo + ' and ' + fooActive);

        editor.selectNext();
        expect(scope.node.innerHTML).toBe('test ' + fooActive + ' and ' + foo);

        editor.selectPrev();
        expect(scope.node.innerHTML).toBe('test ' + foo + ' and ' + fooActive);

        editor.selectPrev();
        expect(scope.node.innerHTML).toBe('test ' + fooActive + ' and ' + foo);

        editor.replace('test');
        expect(scope.node.innerHTML).toBe('test test and ' + foo);

        diff = {};
        diff.test = '';
        editor.setSettings({findreplace: {diff: diff}});
        editor.render();
        $timeout.flush();
        editor.replaceAll('bar');
        expect(scope.node.innerHTML).toBe('bar bar and $foo');

        editor.setSettings({findreplace: null});
        editor.render();
        $rootScope.$digest();
        expect(scope.node.innerHTML).toContain('sderror');
        expect(scope.node.innerHTML).not.toContain('active');
    }));

    it('can replace abbreviations', inject(function(editor, spellcheck, $q, $rootScope, $timeout) {
        editor.setSettings({spellcheck: true});
        var abbreviations = {
            IMF: 'International Monetory Fund',
            WHO: 'World Health Organisation',
            UN: 'United Nations'
        };
        spyOn(spellcheck, 'getAbbreviationsDict').and.returnValue($q.when(abbreviations));
        var scope = createScope('test', $rootScope);
        editor.registerScope(scope);
        scope.node.classList.add('typing');
        scope.node.innerHTML = 'foo';
        editor.commit();
        expect(scope.model.$setViewValue).not.toHaveBeenCalled();
        $rootScope.$digest();
        expect(scope.model.$setViewValue).toHaveBeenCalledWith('foo');
        expect(scope.node.innerHTML).toBe('foo');

        scope.node.innerHTML = 'foo IMF*';
        editor.commit();
        $rootScope.$digest();
        expect(scope.node.innerHTML).toBe('foo ' + abbreviations.IMF);

        scope.node.innerHTML = 'foo IMF IMF* IMF*';
        editor.commit();
        $rootScope.$digest();
        expect(scope.node.innerHTML).toBe('foo IMF ' + abbreviations.IMF + ' ' + abbreviations.IMF);

        scope.node.innerHTML = 'foo IMF* WHO*';
        editor.commit();
        $rootScope.$digest();
        expect(scope.node.innerHTML).toBe('foo ' + abbreviations.IMF + ' ' + abbreviations.WHO);

    }));

    it('can save model value', inject(function(editor, $rootScope, spellcheck, $q) {
        spyOn(spellcheck, 'getAbbreviationsDict').and.returnValue($q.when({}));
        var scope = createScope('foo', $rootScope);
        editor.registerScope(scope);

        scope.node.innerHTML = 'foo';
        editor.commit();
        expect(scope.model.$setViewValue).not.toHaveBeenCalled();

        editor.undo(scope);
        expect(scope.model.$setViewValue).not.toHaveBeenCalled();
        editor.redo(scope);
        expect(scope.model.$setViewValue).not.toHaveBeenCalled();

        scope.node.innerHTML = 'bar';
        editor.commit();
        $rootScope.$digest();
        expect(scope.model.$setViewValue).toHaveBeenCalledWith('bar');

        scope.node.innerHTML = 'baz';
        editor.commit();
        $rootScope.$digest();
        editor.undo(scope);
        editor.undo(scope);
        expect(scope.node.innerHTML).toBe('foo');

        editor.redo(scope);
        expect(scope.node.innerHTML).toBe('bar');

        editor.redo(scope);
        expect(scope.node.innerHTML).toBe('baz');

        editor.undo(scope);
        editor.undo(scope);

        scope.node.innerHTML = 'test';
        editor.commit();
        $rootScope.$digest();
        editor.redo(scope);
        expect(scope.node.innerHTML).toBe('test');
    }));

    it('can check if keyboard event is important or not', inject(function(editor) {
        expect(editor.shouldIgnore({keyCode: 16})).toBe(true);
        expect(editor.shouldIgnore({keyCode: 39})).toBe(true);
        expect(editor.shouldIgnore({shiftKey: true, ctrlKey: true, keyCode: 65})).toBe(true);
        expect(editor.shouldIgnore({keyCode: 65})).toBe(false);
    }));

    it('can observe and apply disableEditorToolbar configuration option',
    inject(function($rootScope, $compile, config) {
        var scope = $rootScope.$new();

        config.editor = {
            disableEditorToolbar: true
        };

        scope.item = {
            body_html: '<p>test</p>',
            type: 'text'
        };

        scope.node = document.createElement('p');
        scope.node.innerHTML = 'test';

        window.MediumEditor = jasmine.createSpy('editor');

        var $elm = $compile('<div sd-text-editor ng-model="item.body_html" data-type="item.type"></div>')(scope);
        scope.$digest();

        var isoScope = $elm.isolateScope();

        isoScope.$digest();

        expect(window.MediumEditor).toHaveBeenCalled();
        expect(window.MediumEditor.calls.argsFor(0)[1].disableToolbar).
            toBe(config.editor.disableEditorToolbar);
    }));

    it('can observe and set tabindex from data-config if defined',
    inject(function($rootScope, $compile, config) {
        var scope = $rootScope.$new();

        scope.item = {
            body_html: '<p>test</p>',
            type: 'text'
        };

        scope.node = document.createElement('p');
        scope.node.innerHTML = 'test';

        window.MediumEditor = jasmine.createSpy('editor');

        var $elm = $compile('<div sd-text-editor ng-model="item.body_html" data-type="item.type"' +
            ' data-config="{tabindex: 1}"></div>')(scope);
        scope.$digest();

        var isoScope = $elm.isolateScope();

        isoScope.$digest();

        expect(isoScope.config.tabindex).toBe(1);
        expect(window.MediumEditor).toHaveBeenCalled();
    }));

});
