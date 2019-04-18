import React from 'react';
import {shallow, mount} from 'enzyme';
import mockStore from './utils';
import {getSpellcheckingDecorator} from '../spellchecker/SpellcheckerDecorator';
import {SpellcheckerContextMenu} from '../spellchecker/SpellcheckerContextMenu';
import {getSpellchecker} from '../spellchecker/default-spellcheckers';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

const spellchecker = getSpellchecker('en');

describe('editor3.components.spellchecker-decorator', () => {
    const SpellcheckerError = getSpellcheckingDecorator('en', {}).component;

    function getWrapper() {
        // to avoid React warning about 'text' prop, we need to create a custom
        // component as the child.
        const CC: any = () => <span />;
        const children = [<CC key={0} text="tihs" start={3} />];
        const {options} = mockStore();

        // eslint-disable-next-line react/no-children-prop
        return mount(<SpellcheckerError offsetKey="wdkow-4236" children={children} />, options);
    }

    beforeEach(window.module(($provide) => {
        $provide.service('spellcheck', ($q) => ({
            suggest: jasmine.createSpy().and.returnValue($q.when(['this', 'tish', 'fish'])),
        }));
    }));

    it('should render children', inject(() => {
        const wrapper = shallow(
            <SpellcheckerError>
                <strong>hello </strong>
                <strong>world</strong>
            </SpellcheckerError>,
        );

        expect(wrapper.find('strong').length).toBe(2);
        expect(wrapper.text()).toBe('hello world');
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
                    spellchecker={spellchecker}
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
                    spellchecker={spellchecker}
                />
            </Provider>,
        );
        const buttons = wrapper.find('button');

        expect(buttons.at(0).text()).toBe('one');
        expect(buttons.at(1).text()).toBe('two');
        expect(buttons.at(2).text()).toBe('three');
    });
});
