import * as React from 'react';
import {mountWithCleanup} from '../tests/helpers';
import {IconButton, Label} from 'superdesk-ui-framework/react';
import {IListEntry} from '../interfaces';
import {ArticleRow} from './article-row';

function entry(overrides: Partial<IListEntry> = {}): IListEntry {
    return {
        uid: 'uid-1',
        contentId: 'article-1',
        title: 'Article title',
        state: 'published',
        category: null,
        updated: null,
        created: null,
        publishSchedule: null,
        thumbnailUrl: null,
        sticky: false,
        stickyPosition: null,
        dangling: false,
        ...overrides,
    };
}

describe('ArticleRow', () => {
    it('renders the article title', () => {
        const wrapper = mountWithCleanup(<ArticleRow entry={entry()} />);

        expect(wrapper.text()).toContain('Article title');
    });

    it('renders a placeholder for dangling entries', () => {
        const wrapper = mountWithCleanup(<ArticleRow entry={entry({dangling: true, title: ''})} />);

        expect(wrapper.find('[data-test-id="content-list-item--dangling"]').hostNodes().text())
            .toBe('Article no longer available');
    });

    it('shows the serial number in list-pane mode', () => {
        const wrapper = mountWithCleanup(<ArticleRow entry={entry()} index={4} showExtras={true} />);

        expect(wrapper.find('.sd-list-item__serial-number').text()).toBe('5');
    });

    it('replaces the serial number with a warning for duplicates', () => {
        const wrapper = mountWithCleanup(
            <ArticleRow entry={entry()} index={0} showExtras={true} isDuplicate={true} />,
        );

        expect(wrapper.find('.sd-list-item__serial-number').length).toBe(0);
        expect(wrapper.find('span[title="Duplicate"]').length).toBe(1);
    });

    it('renders the thumbnail when available', () => {
        const wrapper = mountWithCleanup(
            <ArticleRow entry={entry({thumbnailUrl: 'https://example.com/thumb.jpg'})} />,
        );

        expect(wrapper.find('img').prop('src')).toBe('https://example.com/thumb.jpg');
    });

    it('shows the category label for published articles', () => {
        const wrapper = mountWithCleanup(<ArticleRow entry={entry({state: 'corrected', category: 'News'})} />);

        expect(wrapper.find(Label).prop('text')).toBe('News');
        expect(wrapper.find(Label).prop('type')).toBe('success');
    });

    it('shows a state label for unpublished articles', () => {
        const wrapper = mountWithCleanup(<ArticleRow entry={entry({state: 'in_progress', category: 'News'})} />);

        expect(wrapper.find(Label).prop('text')).toBe('In progress');
        expect(wrapper.find(Label).prop('type')).toBe('warning');
    });

    it('labels "new" articles by their publishing schedule', () => {
        const scheduled = mountWithCleanup(
            <ArticleRow entry={entry({state: 'new', publishSchedule: '2030-01-01T00:00:00+0000'})} />,
        );
        const inProgress = mountWithCleanup(<ArticleRow entry={entry({state: 'new'})} />);

        expect(scheduled.find(Label).prop('text')).toBe('Scheduled');
        expect(inProgress.find(Label).prop('text')).toBe('In progress');
    });

    it('dims the row when it will be trimmed or is already in the list', () => {
        const trimmed = mountWithCleanup(<ArticleRow entry={entry()} willBeTrimmed={true} />);
        const alreadyInList = mountWithCleanup(<ArticleRow entry={entry()} alreadyInList={true} />);
        const normal = mountWithCleanup(<ArticleRow entry={entry()} />);

        expect(trimmed.find('[data-test-id="content-list-item"]').hostNodes().prop('style')?.opacity).toBe(0.5);
        expect(alreadyInList.find('[data-test-id="content-list-item"]').hostNodes().prop('style')?.opacity).toBe(0.5);
        expect(normal.find('[data-test-id="content-list-item"]').hostNodes().prop('style')?.opacity).toBe(1);
    });

    it('fires pin and remove callbacks from the extras column', () => {
        const onPinUnpin = jasmine.createSpy('onPinUnpin');
        const onRemove = jasmine.createSpy('onRemove');
        const wrapper = mountWithCleanup(
            <ArticleRow
                entry={entry()}
                index={0}
                showExtras={true}
                onPinUnpin={onPinUnpin}
                onRemove={onRemove}
            />,
        );

        const pinButton = wrapper.find(IconButton).filter('[icon="pin"]');
        const removeButton = wrapper.find(IconButton).filter('[icon="trash"]');

        expect(pinButton.prop('ariaValue')).toBe('Pin');

        pinButton.find('button').simulate('click');
        removeButton.find('button').simulate('click');

        expect(onPinUnpin).toHaveBeenCalledTimes(1);
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('labels the pin button as unpin for sticky entries', () => {
        const wrapper = mountWithCleanup(
            <ArticleRow entry={entry({sticky: true, stickyPosition: 0})} index={0} showExtras={true} />,
        );

        expect(wrapper.find(IconButton).filter('[icon="pin"]').prop('ariaValue')).toBe('Unpin');
    });

    it('does not render the extras column in picker mode', () => {
        const wrapper = mountWithCleanup(<ArticleRow entry={entry()} />);

        expect(wrapper.find(IconButton).length).toBe(0);
        expect(wrapper.find('.sd-list-item__serial-number').length).toBe(0);
    });
});
