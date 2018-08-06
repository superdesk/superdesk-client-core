import React from 'react';
import {shallow, mount} from 'enzyme';
import {SpellcheckerDecorator} from '../spellchecker';
import {SpellcheckerContextMenuComponent as SpellcheckerContextMenu} from '../spellchecker/SpellcheckerContextMenu';
import mockStore from './utils';

describe('editor3.components.spellchecker-decorator', () => {
    const SpellcheckerError = SpellcheckerDecorator.component;

    function getWrapper() {
        // to avoid React warning about 'text' prop, we need to create a custom
        // component as the child.
        const CC = () => <span />;
        const children = [<CC key={0} text="tihs" start={3} />];
        const {options} = mockStore();

        // eslint-disable-next-line react/no-children-prop
        return mount(<SpellcheckerError children={children} />, options);
    }

    beforeEach(window.module(($provide) => {
        $provide.service('spellcheck', ($q) => ({
            suggest: jasmine.createSpy().and.returnValue($q.when(['this', 'tish', 'fish'])),
        }));
    }));

    it('should render children', inject(() => {
        const children = [<span key={0} text="tihs" start={3} />];
        // eslint-disable-next-line react/no-children-prop
        const wrapper = shallow(<SpellcheckerError children={children} />);

        expect(wrapper.find({text: 'tihs'}).length).toBe(1);
        expect(wrapper.find({text: 'tihs'}).key()).toBe('0');
        expect(wrapper.find({text: 'tihs'}).prop('start')).toBe(3);
    }));

    it('should obtain correct state when context menu is triggered', inject((spellcheck, $rootScope) => {
        const wrapper = getWrapper();

        expect(wrapper.state().menuShowing).toBeFalsy();

        wrapper.simulate('contextmenu', new Event('contextmenu'));
        $rootScope.$apply();

        expect(spellcheck.suggest).toHaveBeenCalledWith('tihs');
        expect(wrapper.state().menuShowing).toBeTruthy();
        expect(wrapper.state().suggestions).toEqual(['this', 'tish', 'fish']);
    }));

    it('should show context menu with correct props', inject(($rootScope) => {
        const wrapper = getWrapper();

        wrapper.simulate('contextmenu', new Event('contextmenu'));
        $rootScope.$apply();
        wrapper.update();

        const ctxMenu = wrapper.find('SpellcheckerContextMenuComponent');

        expect(ctxMenu.length).toBe(1);
        expect(ctxMenu.prop('suggestions')).toEqual(['this', 'tish', 'fish']);
        expect(ctxMenu.prop('word')).toEqual({text: 'tihs', offset: 3});
    }));

    it('should hide context menu when window is clicked', inject(($rootScope) => {
        const wrapper = getWrapper();

        wrapper.simulate('contextmenu', new Event('contextmenu'));
        $rootScope.$apply();
        wrapper.update();

        expect(wrapper.state().menuShowing).toBeTruthy();
        expect(wrapper.find('SpellcheckerContextMenuComponent').length).toBe(1);

        $(window).trigger('mousedown');
        wrapper.update();

        expect(wrapper.state().menuShowing).toBeFalsy();
        expect(wrapper.find('SpellcheckerContextMenuComponent').length).toBe(0);
    }));
});

describe('editor3.components.spellchecker-context-menu', () => {
    const suggestions = [
        {value: 'one', key: 'oneKey'},
        {value: 'two', key: 'twoKey'},
        {value: 'three', key: 'threeKey'},
    ];

    beforeEach(window.module(($provide) => {
        $provide.service('spellcheck', ($q) => ({
            addWord: jasmine.createSpy().and.returnValue(null),
        }));
    }));

    it('should correctly render no suggestions', () => {
        const element = document.createElement('div');// required for positioning

        document.body.appendChild(element);

        const wrapper = mount(<SpellcheckerContextMenu targetElement={element} suggestions={[]} />);
        const buttons = wrapper.find('button');

        expect(buttons.first().text()).toBe('SORRY, NO SUGGESTIONS.');
        expect(buttons.at(1).text()).toBe('Add to dictionary');
        expect(buttons.at(2).text()).toBe('Ignore word');
    });

    it('should correctly render with suggestions', () => {
        const element = document.createElement('div');// required for positioning

        document.body.appendChild(element);

        const wrapper = mount(<SpellcheckerContextMenu targetElement={element} suggestions={suggestions} />);
        const buttons = wrapper.find('button');

        expect(buttons.at(0).text()).toBe('one');
        expect(buttons.at(1).text()).toBe('two');
        expect(buttons.at(2).text()).toBe('three');
    });

    it('should add word to dictionary when requested', inject((spellcheck) => {
        const element = document.createElement('div');// required for positioning

        document.body.appendChild(element);

        const refreshWord = jasmine.createSpy();
        const wrapper = mount(
            <SpellcheckerContextMenu
                targetElement={element}
                word={{text: 'abc'}}
                refreshWord={refreshWord}
                suggestions={[]} />
        );

        wrapper
            .find('button')
            .at(1)
            .simulate('mousedown');

        expect(spellcheck.addWord).toHaveBeenCalledWith('abc', false);
        expect(refreshWord).toHaveBeenCalledWith({text: 'abc'});
    }));

    it('should ignore word when requested', inject((spellcheck) => {
        const element = document.createElement('div');// required for positioning

        document.body.appendChild(element);

        const refreshWord = jasmine.createSpy();
        const wrapper = mount(
            <SpellcheckerContextMenu
                targetElement={element}
                word={{text: 'abc'}}
                refreshWord={refreshWord}
                suggestions={[]} />);

        wrapper
            .find('button')
            .at(2)
            .simulate('mousedown');

        expect(spellcheck.addWord).toHaveBeenCalledWith('abc', true);
        expect(refreshWord).toHaveBeenCalledWith({text: 'abc'});
    }));

    it('should replace word when requested', inject((spellcheck) => {
        const element = document.createElement('div');// required for positioning

        document.body.appendChild(element);

        const replaceWord = jasmine.createSpy();
        const wrapper = mount(
            <SpellcheckerContextMenu
                targetElement={element}
                word={{text: 'abc'}}
                replaceWord={replaceWord}
                suggestions={suggestions} />);

        wrapper
            .find('button')
            .first()
            .simulate('mousedown');

        expect(replaceWord).toHaveBeenCalledWith({
            word: {text: 'abc'},
            newWord: 'oneKey',
        });
    }));
});
