import * as React from 'react';
import {ReactWrapper} from 'enzyme';
import {mountWithCleanup} from '../tests/helpers';
import {DragDropContext, Draggable} from 'react-beautiful-dnd';
import {Button, Dropdown, NavButton, SearchBar} from 'superdesk-ui-framework/react';
import {IContentList, IListEntry} from '../interfaces';
import {ArticleRow} from './article-row';
import {LimitNotification} from './limit-notification';
import {ListPane} from './list-pane';

function list(id: string, overrides: Partial<IContentList> = {}): IContentList {
    return {
        _id: id,
        _created: '2024-01-01T00:00:00+0000',
        _updated: '2024-01-01T00:00:00+0000',
        _etag: `etag-${id}`,
        _links: {},
        name: id,
        type: 'manual',
        ...overrides,
    };
}

function entry(contentId: string, overrides: Partial<IListEntry> = {}): IListEntry {
    return {
        uid: contentId,
        contentId,
        title: `title ${contentId}`,
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

interface IMountOptions {
    list?: IContentList;
    lists?: Array<IContentList>;
    entries?: Array<IListEntry>;
    loading?: boolean;
    searchString?: string;
    changesCount?: number;
    saving?: boolean;
    onSearch?: (searchString: string) => void;
    onBack?: () => void;
    onOpenList?: (listId: string) => void;
    onSave?: () => void;
    onPinUnpin?: (uid: string) => void;
    onRemove?: (uid: string) => void;
}

function mountPane(options: IMountOptions = {}): ReactWrapper {
    const currentList = options.list ?? list('list-1', {name: 'My list'});

    return mountWithCleanup(
        <DragDropContext onDragEnd={() => undefined}>
            <ListPane
                list={currentList}
                lists={options.lists ?? [currentList]}
                entries={options.entries ?? []}
                loading={options.loading ?? false}
                searchString={options.searchString ?? ''}
                changesCount={options.changesCount ?? 0}
                saving={options.saving ?? false}
                onSearch={options.onSearch ?? (() => undefined)}
                onBack={options.onBack ?? (() => undefined)}
                onOpenList={options.onOpenList ?? (() => undefined)}
                onSave={options.onSave ?? (() => undefined)}
                onPinUnpin={options.onPinUnpin ?? (() => undefined)}
                onRemove={options.onRemove ?? (() => undefined)}
            />
        </DragDropContext>,
    );
}

describe('ListPane', () => {
    it('shows a drop hint when the list is empty', () => {
        expect(mountPane().text()).toContain('Drag your articles here');
    });

    it('renders a row per entry', () => {
        const wrapper = mountPane({entries: [entry('a'), entry('b')]});

        expect(wrapper.find(ArticleRow).length).toBe(2);
        expect(wrapper.text()).not.toContain('Drag your articles here');
    });

    it('shows the current list name and offers the other lists in the dropdown', () => {
        const onOpenList = jasmine.createSpy('onOpenList');
        const current = list('list-1', {name: 'Current'});
        const wrapper = mountPane({
            list: current,
            lists: [current, list('list-2', {name: 'Other'})],
            onOpenList,
        });

        expect(wrapper.find(NavButton).at(1).prop('text')).toBe('Current');

        const dropdownGroup = wrapper.find(Dropdown).prop('items')[0] as {
            items: Array<{label: string; onSelect: () => void}>;
        };

        expect(dropdownGroup.items.map(({label}) => label)).toEqual(['Other']);

        dropdownGroup.items[0].onSelect();

        expect(onOpenList).toHaveBeenCalledWith('list-2');
    });

    it('fires onBack from the back button', () => {
        const onBack = jasmine.createSpy('onBack');
        const wrapper = mountPane({onBack});

        (wrapper.find(NavButton).at(0).prop('onClick') as () => void)();

        expect(onBack).toHaveBeenCalled();
    });

    it('fires onSearch when the search bar submits', () => {
        const onSearch = jasmine.createSpy('onSearch');
        const wrapper = mountPane({onSearch});

        (wrapper.find(SearchBar).prop('onSubmit') as (value: string) => void)('query');

        expect(onSearch).toHaveBeenCalledWith('query');
    });

    it('disables the save button unless there are unsaved changes', () => {
        expect(mountPane({changesCount: 0}).find(Button).prop('disabled')).toBe(true);
        expect(mountPane({changesCount: 2}).find(Button).prop('disabled')).toBe(false);
        expect(mountPane({changesCount: 2, saving: true}).find(Button).prop('disabled')).toBe(true);
    });

    it('fires onSave from the save button', () => {
        const onSave = jasmine.createSpy('onSave');
        const wrapper = mountPane({changesCount: 1, onSave});

        wrapper.find(Button).find('button').simulate('click');

        expect(onSave).toHaveBeenCalled();
    });

    it('hides rows that do not match the search string', () => {
        const wrapper = mountPane({
            entries: [entry('a', {title: 'Sports update'}), entry('b', {title: 'Politics'})],
            searchString: 'sports',
        });

        const rowStyle = (index: number) =>
            wrapper.find(Draggable).at(index).find('div').at(0).prop('style');

        expect(rowStyle(0)?.display).toBeUndefined();
        expect(rowStyle(1)?.display).toBe('none');
    });

    it('disables dragging while filtering and for sticky entries', () => {
        const wrapper = mountPane({
            entries: [entry('a', {sticky: true, stickyPosition: 0}), entry('b')],
        });
        const filtering = mountPane({entries: [entry('a')], searchString: 'x'});

        expect(wrapper.find(Draggable).at(0).prop('isDragDisabled')).toBe(true);
        expect(wrapper.find(Draggable).at(1).prop('isDragDisabled')).toBe(false);
        expect(filtering.find(Draggable).at(0).prop('isDragDisabled')).toBe(true);
    });

    it('marks duplicate entries', () => {
        const wrapper = mountPane({
            entries: [entry('a'), entry('a', {uid: 'a-2'}), entry('b')],
        });

        expect(wrapper.find(ArticleRow).at(0).prop('isDuplicate')).toBe(true);
        expect(wrapper.find(ArticleRow).at(1).prop('isDuplicate')).toBe(true);
        expect(wrapper.find(ArticleRow).at(2).prop('isDuplicate')).toBe(false);
    });

    it('shows the limit notification before the first entry over the limit and dims trimmed rows', () => {
        const wrapper = mountPane({
            list: list('list-1', {limit: 2}),
            entries: [entry('a'), entry('b'), entry('c')],
        });

        expect(wrapper.find(LimitNotification).length).toBe(1);
        expect(wrapper.find(LimitNotification).prop('limit')).toBe(2);
        expect(wrapper.find(ArticleRow).at(2).prop('willBeTrimmed')).toBe(true);
        expect(wrapper.find(ArticleRow).at(1).prop('willBeTrimmed')).toBe(false);
    });

    it('shows no limit notification when the list has no limit or is within it', () => {
        expect(mountPane({entries: [entry('a')]}).find(LimitNotification).length).toBe(0);
        expect(
            mountPane({list: list('list-1', {limit: 5}), entries: [entry('a')]})
                .find(LimitNotification).length,
        ).toBe(0);
    });

    it('passes pin and remove callbacks through with the entry uid', () => {
        const onPinUnpin = jasmine.createSpy('onPinUnpin');
        const onRemove = jasmine.createSpy('onRemove');
        const wrapper = mountPane({entries: [entry('a')], onPinUnpin, onRemove});

        (wrapper.find(ArticleRow).prop('onPinUnpin') as () => void)();
        (wrapper.find(ArticleRow).prop('onRemove') as () => void)();

        expect(onPinUnpin).toHaveBeenCalledWith('a');
        expect(onRemove).toHaveBeenCalledWith('a');
    });
});
