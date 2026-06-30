import React from 'react';
import {mount} from 'enzyme';
import {IArticle, IExposedFromAuthoring} from 'superdesk-api';
import {ToolbarContextProvider} from '../toolbar-context';
import {HeaderWordCountSourceWidget} from '../header-word-count-source-widget';

function renderWith(item: Partial<IArticle>) {
    // The widget only reads exposed.getLatestItem(); the rest of the interface is irrelevant here.
    const exposed = {getLatestItem: () => item as IArticle} as IExposedFromAuthoring<IArticle>;

    return mount(
        <ToolbarContextProvider exposed={exposed} authoringStorage={null}>
            <HeaderWordCountSourceWidget entity={item as IArticle} />
        </ToolbarContextProvider>,
    );
}

describe('authoring-react header word count and source', () => {
    it('counts words in body_html the way the legacy header did (strips tags)', () => {
        const wrapper = renderWith({type: 'text', body_html: '<p>one two three four</p>'});

        expect(wrapper.find('[data-test-id="authoring-header-word-count"]').prop('data-test-value')).toBe('4');
    });

    it('updates the count when body_html changes', () => {
        const wrapper = renderWith({type: 'text', body_html: '<p>only two</p>'});

        expect(wrapper.find('[data-test-id="authoring-header-word-count"]').prop('data-test-value')).toBe('2');
    });

    it('renders a zero count for an empty body', () => {
        const wrapper = renderWith({type: 'text', body_html: ''});

        expect(wrapper.find('[data-test-id="authoring-header-word-count"]').prop('data-test-value')).toBe('0');
    });

    it('renders the source when present', () => {
        const wrapper = renderWith({type: 'text', body_html: '<p>x</p>', source: 'AAP'});

        const source = wrapper.find('[data-test-id="authoring-header-source"]');

        expect(source.prop('data-test-value')).toBe('AAP');
        expect(source.text()).toContain('AAP');
    });

    it('hides the source block when there is no source', () => {
        const wrapper = renderWith({type: 'text', body_html: '<p>x</p>'});

        expect(wrapper.find('[data-test-id="authoring-header-source"]').exists()).toBe(false);
    });

    it('renders nothing for non-text items', () => {
        const wrapper = renderWith({type: 'picture', body_html: '<p>ignored</p>'});

        expect(wrapper.find('[data-test-id="authoring-header-word-count"]').exists()).toBe(false);
    });
});
