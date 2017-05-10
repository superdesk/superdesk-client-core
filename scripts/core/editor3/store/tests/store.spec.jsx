import createEditorStore from '..';

describe('editor3.store', () => {
    beforeEach(window.module(($provide) => {
        $provide.service('spellcheck', ($q) => ({
            setLanguage: jasmine.createSpy(),
            getDict: jasmine.createSpy().and.returnValue($q.when(null)),
            isCorrectWord: jasmine.createSpy()
        }));
    }));

    it('should initialize with correct values', inject((spellcheck) => {
        const store = createEditorStore({
            language: 'en',
            editorFormat: '123',
            readOnly: false,
            trim: true,
            onChange: () => { /* no-op */ },
            value: 'abc'
        });

        const state = store.getState();

        expect(spellcheck.setLanguage).toHaveBeenCalledWith('en');
        expect(spellcheck.getDict).toHaveBeenCalled();
        expect(state.readOnly).toBe(false);
        expect(state.showToolbar).toBe(true);
        expect(state.editorFormat).toBe('123');
    }));
});
