import {EditorState, ContentState} from 'draft-js';
import reducer from '..';

/**
 * @description Creates a new store state that contains the editorState and searchTerm.
 * @param {string} txt The text in the editor
 * @param {Object} searchTerm The searchTerm data (index, pattern, caseSensitive)
 * @returns {Object}
 */
function withSearchTerm(txt, searchTerm) {
    const editorState = EditorState.createWithContent(ContentState.createFromText(txt));

    return {editorState, searchTerm};
}

describe('editor3.reducers', () => {
    it('EDITOR_CHANGE_STATE', () => {
        const editorState = {getCurrentContent: () => 'abc'};
        const onChangeValue = jasmine.createSpy();

        reducer({
            onChangeValue: onChangeValue,
            editorState: EditorState.createEmpty()
        }, {
            type: 'EDITOR_CHANGE_STATE',
            payload: editorState
        });

        expect(onChangeValue).toHaveBeenCalledWith('abc');
    });

    it('EDITOR_DRAG_DROP', () => {
        const event = new DragEvent('drop');
        const getData = jasmine.createSpy().and.callFake(() => '{"a": 1}');

        event.originalEvent = {
            dataTransfer: {
                getData: getData,
                types: ['superdesk/image']
            }
        };

        const startState = {
            editorState: EditorState.createEmpty(),
            onChangeValue: () => ({})
        };

        const {editorState} = reducer(startState, {
            type: 'EDITOR_DRAG_DROP',
            payload: event
        });

        const contentState = editorState.getCurrentContent();
        const entityKey = contentState.getLastCreatedEntityKey();
        const entity = contentState.getEntity(entityKey);

        expect(entity.getType()).toBe('IMAGE');
        expect(entity.getMutability()).toBe('MUTABLE');
        expect(entity.getData()).toEqual({img: {a: 1}});
        expect(getData).toHaveBeenCalledWith('superdesk/image');
    });

    it('HIGHLIGHTS_RENDER highlight', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'Apple', caseSensitive: false}
        );

        const state = reducer(startState, {type: 'HIGHLIGHTS_RENDER'});
        const block = state.editorState.getCurrentContent().getFirstBlock();

        expect(block.getInlineStyleAt(0).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(13).has('HIGHLIGHT_STRONG')).toBe(true);
        expect(block.getInlineStyleAt(22).has('HIGHLIGHT')).toBe(false);
        expect(block.getInlineStyleAt(22).has('HIGHLIGHT_STRONG')).toBe(false);
        expect(block.getInlineStyleAt(26).has('HIGHLIGHT')).toBe(true);
    });

    it('HIGHLIGHTS_RENDER case sensitive', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'Apple', caseSensitive: true}
        );

        const state = reducer(startState, {type: 'HIGHLIGHTS_RENDER'});
        const block = state.editorState.getCurrentContent().getFirstBlock();

        expect(block.getInlineStyleAt(0).has('HIGHLIGHT')).toBe(false);
        expect(block.getInlineStyleAt(13).has('HIGHLIGHT_STRONG')).toBe(false);
    });

    it('HIGHLIGHTS_RENDER special characters', () => {
        const startState = withSearchTerm(
            '?apple banana ?apple ananas apple prune',
            {index: 1, pattern: '?Apple', caseSensitive: false}
        );

        const state = reducer(startState, {type: 'HIGHLIGHTS_RENDER'});
        const block = state.editorState.getCurrentContent().getFirstBlock();

        expect(block.getInlineStyleAt(0).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(1).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(14).has('HIGHLIGHT_STRONG')).toBe(true);
        expect(block.getInlineStyleAt(15).has('HIGHLIGHT_STRONG')).toBe(true);
    });

    it('HIGHLIGHTS_CRITERIA change term', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'apple', caseSensitive: false}
        );

        const state = reducer(startState, {
            type: 'HIGHLIGHTS_CRITERIA',
            payload: {
                index: -1,
                pattern: 'banana',
                caseSensitive: true
            }
        });

        expect(state.searchTerm.index).toBe(-1);
        expect(state.searchTerm.caseSensitive).toBe(true);
        expect(state.searchTerm.pattern).toBe('banana');
    });

    it('HIGHLIGHTS_CRITERIA change sensitivity', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'apple', caseSensitive: false}
        );

        const state = reducer(startState, {
            type: 'HIGHLIGHTS_CRITERIA',
            payload: {caseSensitive: true, pattern: 'apple'}
        });

        expect(state.searchTerm.index).toBe(0);
    });

    it('HIGHLIGHTS_FIND_NEXT', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'Apple', caseSensitive: false}
        );

        const state = reducer(startState, {type: 'HIGHLIGHTS_FIND_NEXT'});
        const block = state.editorState.getCurrentContent().getFirstBlock();

        expect(state.searchTerm.index).toBe(2);
        expect(block.getInlineStyleAt(0).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(13).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(26).has('HIGHLIGHT_STRONG')).toBe(true);
    });

    it('HIGHLIGHTS_FIND_NEXT past last', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 2, pattern: 'Apple', caseSensitive: false}
        );

        const state = reducer(startState, {type: 'HIGHLIGHTS_FIND_NEXT'});
        const block = state.editorState.getCurrentContent().getFirstBlock();

        expect(state.searchTerm.index).toBe(0);
        expect(block.getInlineStyleAt(0).has('HIGHLIGHT_STRONG')).toBe(true);
        expect(block.getInlineStyleAt(13).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(26).has('HIGHLIGHT')).toBe(true);
    });

    it('HIGHLIGHTS_FIND_PREV', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'Apple', caseSensitive: false}
        );

        const state = reducer(startState, {type: 'HIGHLIGHTS_FIND_PREV'});
        const block = state.editorState.getCurrentContent().getFirstBlock();

        expect(state.searchTerm.index).toBe(0);
        expect(block.getInlineStyleAt(0).has('HIGHLIGHT_STRONG')).toBe(true);
        expect(block.getInlineStyleAt(13).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(26).has('HIGHLIGHT')).toBe(true);
    });

    it('HIGHLIGHTS_FIND_PREV before first', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 0, pattern: 'Apple', caseSensitive: false}
        );

        const state = reducer(startState, {type: 'HIGHLIGHTS_FIND_PREV'});
        const block = state.editorState.getCurrentContent().getFirstBlock();

        expect(state.searchTerm.index).toBe(2);
        expect(block.getInlineStyleAt(0).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(13).has('HIGHLIGHT')).toBe(true);
        expect(block.getInlineStyleAt(26).has('HIGHLIGHT_STRONG')).toBe(true);
    });

    it('HIGHLIGHTS_FIND_REPLACE', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'Apple', caseSensitive: false}
        );

        const state = reducer(startState, {
            type: 'HIGHLIGHTS_REPLACE',
            payload: 'kiwi'
        });

        const text = state.editorState.getCurrentContent().getPlainText('\n');

        expect(text).toBe('apple banana kiwi ananas apple prune');
    });

    it('HIGHLIGHTS_FIND_REPLACE_ALL', () => {
        const startState = withSearchTerm(
            'apple banana apple ananas apple prune',
            {index: 1, pattern: 'Apple', caseSensitive: false}
        );

        const state = reducer(startState, {
            type: 'HIGHLIGHTS_REPLACE_ALL',
            payload: 'kiwi'
        });

        const text = state.editorState.getCurrentContent().getPlainText('\n');

        expect(text).toBe('kiwi banana kiwi ananas kiwi prune');
    });

    it('SPELLCHECKER_REPLACE_WORD', () => {
        const editorState = EditorState.createWithContent(
            ContentState.createFromText('abcd efgh')
        );

        const state = reducer({editorState}, {
            type: 'SPELLCHECKER_REPLACE_WORD',
            payload: {
                word: {text: 'efgh', offset: 5},
                newWord: '1234'
            }
        });

        const text = state.editorState.getCurrentContent().getPlainText();

        expect(text).toBe('abcd 1234');
    });
});
