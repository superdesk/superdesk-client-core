import React from 'react';
import {mount} from 'enzyme';
import {SpellcheckerContextMenu} from '../spellchecker/SpellcheckerContextMenu';
import * as defaultSpellcheckers from '../spellchecker/default-spellcheckers';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {EditorState, ContentState} from 'draft-js';
import {ISpellchecker} from '../spellchecker/interfaces';
import editorReducers from 'core/editor3/reducers';
import {Editor3} from '..';

const editorStateInitial = EditorState.createWithContent(ContentState.createFromText('This speling is not correkt.'));

const testSpellchecker: ISpellchecker = {
    check: () => Promise.resolve([
        {
            startOffset: 5,
            text: 'speling',
            suggestions: ['spelling'],
        },
        {
            startOffset: 20,
            text: 'correkt',
            suggestions: ['correct'],
        },
    ]),
    actions: {
        testAction: {
            label: 'test action',
            perform: (warning) => Promise.resolve(),
        },
    },
};

describe('editor3.spellchecker', () => {
    beforeEach(window.module(($provide) => {
        $provide.service('spellcheck', ($q) => ({
            suggest: jasmine.createSpy().and.returnValue($q.when(['this', 'tish', 'fish'])),
        }));
    }));

    it('displays spellchecking errors in the editor', (done) => inject(() => {
        spyOn(defaultSpellcheckers, 'getSpellchecker').and.returnValue(testSpellchecker);

        const initialState = {
            editorState: editorStateInitial,
            spellchecking: {
                enabled: true,
                language: 'en',
                inProgress: false,
                warningsByBlock: {},
            },
        };

        const wrapper = mount(
            <Provider store={createStore(editorReducers, initialState)}>
                <Editor3 />
            </Provider>,
        );

        // waiting for the spellchecker to load
        setTimeout(() => {
            wrapper.update();

            const warningsInDom = wrapper.find('.word-typo');

            expect(warningsInDom.length).toBe(2);

            expect(warningsInDom.at(0).text()).toBe('speling');
            expect(warningsInDom.at(1).text()).toBe('correkt');

            expect(wrapper.text().indexOf('speling')).toBe(5);
            expect(wrapper.text().indexOf('correkt')).toBe(20);

            done();
        }, 1000);
    }));

    it('doesn\'t display the errors if the spellchecker is off', (done) => inject(() => {
        spyOn(defaultSpellcheckers, 'getSpellchecker').and.returnValue(testSpellchecker);

        const initialState = {
            editorState: editorStateInitial,
            spellchecking: {
                enabled: false,
                language: 'en',
                inProgress: false,
                warningsByBlock: {},
            },
        };

        const wrapper = mount(
            <Provider store={createStore(editorReducers, initialState)}>
                <Editor3 />
            </Provider>,
        );

        // waiting for the spellchecker to load
        setTimeout(() => {
            wrapper.update();

            const warningsInDom = wrapper.find('.word-typo');

            expect(warningsInDom.length).toBe(0);

            done();
        }, 1000);
    }));
});

describe('editor3.components.spellchecker-context-menu', () => {
    const warningWithoutSuggestions = {
        startOffset: 0,
        text: 'abc',
        suggestions: [],
    };

    const warningWithSuggestions = {
        startOffset: 0,
        text: 'abc',
        suggestions: ['one', 'two', 'three'],
    };

    beforeEach(window.module(($provide) => {
        $provide.service('spellcheck', ($q) => ({
            addWord: jasmine.createSpy().and.returnValue(null),
        }));
    }));

    it('should correctly render no suggestions', () => {
        const element = document.createElement('div'); // required for positioning

        document.body.appendChild(element);

        const wrapper = mount(
            <Provider store={createStore(() => ({}))}>
                <SpellcheckerContextMenu
                    targetElement={element}
                    warning={warningWithoutSuggestions}
                    spellchecker={defaultSpellcheckers.getSpellchecker('en')}
                />
            </Provider>,
        );
        const buttons = wrapper.find('button');

        expect(buttons.first().text()).toBe('SORRY, NO SUGGESTIONS.');
        expect(buttons.at(1).text()).toBe('Add to dictionary');
        expect(buttons.at(2).text()).toBe('Ignore word');
    });

    it('should correctly render with suggestions', () => {
        const element = document.createElement('div'); // required for positioning

        document.body.appendChild(element);

        const wrapper = mount(
            <Provider store={createStore(() => ({}))}>
                <SpellcheckerContextMenu
                    targetElement={element}
                    warning={warningWithSuggestions}
                    spellchecker={defaultSpellcheckers.getSpellchecker('en')}
                />
            </Provider>,
        );
        const buttons = wrapper.find('button');

        expect(buttons.at(0).text()).toBe('one');
        expect(buttons.at(1).text()).toBe('two');
        expect(buttons.at(2).text()).toBe('three');
    });
});
