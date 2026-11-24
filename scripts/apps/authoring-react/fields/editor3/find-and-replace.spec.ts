import {createStore} from 'redux';
import {ContentState, EditorState} from 'draft-js';
import reducer from 'core/editor3/reducers';
import {setFindCriteria} from './find-and-replace';

function getStore(text: string) {
    return createStore(reducer, {
        editorState: EditorState.createWithContent(ContentState.createFromText(text)),
        searchTerm: {index: -1, pattern: '', caseSensitive: true},
        onChangeValue: () => null,
    } as any);
}

describe('authoring-react find and replace criteria', () => {
    it('selects the first match of a new pattern', () => {
        const store = getStore('one apple two apple');

        setFindCriteria(store, 'apple', true);

        expect(store.getState().searchTerm.index).toBe(0);
    });

    it('stays on the first match when only the case sensitivity changes', () => {
        const store = getStore('one apple two apple');

        setFindCriteria(store, 'apple', true);
        setFindCriteria(store, 'apple', false);

        expect(store.getState().searchTerm.index).toBe(0);
    });

    it('selects nothing once the pattern is cleared', () => {
        const store = getStore('one apple two apple');

        setFindCriteria(store, 'apple', true);
        setFindCriteria(store, '', true);

        expect(store.getState().searchTerm.index).toBe(-1);
    });

    it('lets Replace act on the first match straight after Find', () => {
        const store = getStore('one apple two apple');

        setFindCriteria(store, 'apple', true);
        store.dispatch({type: 'HIGHLIGHTS_REPLACE', payload: 'orange'});

        expect(store.getState().editorState.getCurrentContent().getPlainText()).toBe('one orange two apple');
    });
});
