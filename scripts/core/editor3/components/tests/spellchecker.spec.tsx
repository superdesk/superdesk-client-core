import React from 'react';
import {mount} from 'enzyme';
import * as defaultSpellcheckers from '../spellchecker/default-spellcheckers';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {EditorState, ContentState} from 'draft-js';
import editorReducers from 'core/editor3/reducers';
import {Editor3} from '..';
import {noop} from 'lodash';

const editorStateInitial = EditorState.createWithContent(ContentState.createFromText('This speling is not correkt.'));

const testSpellchecker = {
    check: () => Promise.resolve([
        {
            startOffset: 5,
            text: 'speling',
            suggestions: ['spelling'],
        },
        {
            startOffset: 20,
            text: 'correkt',
            suggestions: ['correct', 'incorrect'],
        },
    ]),
    actions: {
        testAction: {
            label: 'test action',
            perform: (warning) => Promise.resolve(),
        },
        testAction2: {
            label: 'test action 2',
            perform: (warning) => Promise.resolve(),
        },
    },
};

describe('editor3.spellchecker', () => {
    it('displays spellchecking errors in the editor', (done) => {
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

            const warningsInDom = wrapper.find('[data-test-id="spellchecker-warning"]');

            expect(warningsInDom.length).toBe(2);

            expect(warningsInDom.at(0).text()).toBe('speling');
            expect(warningsInDom.at(1).text()).toBe('correkt');

            expect(wrapper.text().indexOf('speling')).toBe(5);
            expect(wrapper.text().indexOf('correkt')).toBe(20);

            wrapper.unmount();

            done();
        }, 1000);
    });

    it('doesn\'t display the errors if the spellchecker is off', (done) => {
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
        // the spellchecker is intentionally asynchronous to allow the editor to load faster
        setTimeout(() => {
            wrapper.update();

            const warningsInDom = wrapper.find('[data-test-id="spellchecker-warning"]');

            expect(warningsInDom.length).toBe(0);

            wrapper.unmount();

            done();
        }, 1000);
    });

    it('displays suggestions and actions', (done) => {
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
        // the spellchecker is intentionally asynchronous to allow the editor to load faster
        setTimeout(() => {
            wrapper.update();

            wrapper.find('[data-test-id="spellchecker-warning"]')
                .at(1)
                .simulate('contextmenu');

            const suggestions = Array.from(document.querySelectorAll('[data-test-id="spellchecker-menu--suggestion"]'))
                .map((el) => el.textContent);

            expect(suggestions[0]).toBe('correct');
            expect(suggestions[1]).toBe('incorrect');

            const actions = Array.from(document.querySelectorAll('[data-test-id="spellchecker-menu--action"]'))
                .map((el) => el.textContent);

            expect(actions[0]).toBe('test action');
            expect(actions[1]).toBe('test action 2');

            wrapper.unmount();

            done();
        }, 1000);
    });

    it('can apply spellchecker suggestion', (done) => {
        spyOn(defaultSpellcheckers, 'getSpellchecker').and.returnValue(testSpellchecker);

        const initialState = {
            editorState: editorStateInitial,
            spellchecking: {
                enabled: true,
                language: 'en',
                inProgress: false,
                warningsByBlock: {},
            },
            onChangeValue: noop,
        };

        const wrapper = mount(
            <Provider store={createStore(editorReducers, initialState)}>
                <Editor3 />
            </Provider>,
        );

        // waiting for the spellchecker to load
        // the spellchecker is intentionally asynchronous to allow the editor to load faster
        setTimeout(() => {
            wrapper.update();
            wrapper.find('[data-test-id="spellchecker-warning"]')
                .at(1)
                .simulate('contextmenu');

            expect(document.querySelectorAll('[data-test-id="spellchecker-menu--suggestion"]').length).toBe(2);
            expect(wrapper.text()).toBe('This speling is not correkt.');

            const suggestion: HTMLButtonElement =
                document.querySelector('[data-test-id="spellchecker-menu--suggestion"]');

            const event = new MouseEvent('mousedown');

            event.initEvent('mousedown', true, true);

            suggestion.dispatchEvent(event);

            wrapper.update();
            expect(wrapper.text()).toBe('This speling is not correct.');
            // the word "correkt" was replaced to "correct"  ^

            wrapper.unmount();

            done();
        }, 1000);
    });

    it('works around around jasmine\'s buggy behaviour', (done) => {
        // it looks like jasmine is starting one test before previous has finished
        // & destroying spies sooner the test finishes(at least in case of an async test)
        // I don't see how this could have an any effect otherwise.

        spyOn(defaultSpellcheckers, 'getSpellchecker').and.returnValue(testSpellchecker);
        setTimeout(done, 1000);
    });
});
