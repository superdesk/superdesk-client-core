import createEditorStore from '..';
import {convertToRaw, ContentState} from 'draft-js';

describe('editor3.store', () => {
    it('should initialize with correct values', inject(($q) => {
        const spellcheck = {
            setLanguage: jasmine.createSpy(),
            getDict: jasmine.createSpy().and.returnValue($q.when(null)),
            getAbbreviationsDict: jasmine.createSpy().and.returnValue($q.when(null)),
            isCorrectWord: jasmine.createSpy(),
        };

        const store = createEditorStore(
            {
                editorState: convertToRaw(ContentState.createFromText('')),
                language: 'en',
                editorFormat: ['h1'],
                readOnly: false,
                trim: true,
                onChange: () => { /* no-op */ },
                value: 'abc',
                item: {},
                limitBehavior: 'highlight',
                limit: 42,
            },
            spellcheck,
        );

        const state = store.getState();

        expect(spellcheck.setLanguage).toHaveBeenCalledWith('en');
        expect(spellcheck.getDict).toHaveBeenCalled();
        expect(state.readOnly).toBe(false);
        expect(state.showToolbar).toBe(true);
        expect(state.editorFormat.length).toBe(1);
        expect(state.editorFormat[0]).toBe('h1');
        expect(state.limitConfig.ui).toBe('highlight');
        expect(state.limitConfig.chars).toBe(42);
    }));
});
