import React from 'react';
import {shallow} from 'enzyme';
import {Editor3Component} from '../components/Editor3';
import createEditorStore from '../store';
import {EditorState, ContentState} from 'draft-js';
import ng from 'core/services/ng';
import reducer from '../reducers';

describe('Editor3Component', () => {
    it('check if toolbar is not showed', () => {
        const wrapper = shallow(<Editor3Component showToolbar={ false } onChange={(x) => x} />);

        expect(wrapper.find('DraftEditor').length).toBe(1);
        expect(wrapper.find('Toolbar').length).toBe(0);
    });
});

describe('Editor3.createEditorStore', () => {
    it('should initialize with correct values', inject(($q) => {
        const setLanguage = jasmine.createSpy(),
            getDict = jasmine.createSpy().and.callFake(() => $q.when(null)),
            isCorrectWord = jasmine.createSpy();

        ng.mock('spellcheck', {setLanguage, getDict, isCorrectWord});

        const store = createEditorStore({
            language: 'en',
            editorFormat: '123',
            readOnly: false,
            trim: true,
            onChange: () => { /* no-op */ },
            value: 'abc'
        });

        const state = store.getState();

        expect(setLanguage).toHaveBeenCalledWith('en');
        expect(getDict).toHaveBeenCalled();
        expect(state.readOnly).toBe(false);
        expect(state.showToolbar).toBe(true);
        expect(state.singleLine).toBe(false);
        expect(state.editorFormat).toBe('123');

        ng.unmock('spellcheck');
    }));
});

describe('Editor3.reducers', () => {
    it('SPELLCHECKER_REPLACE_WORD should correctly replace words', () => {
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
