import * as React from 'react';
import {ReactWrapper} from 'enzyme';
import {mountWithCleanup} from '../tests/helpers';
import {DragDropContext, Draggable} from 'react-beautiful-dnd';
import {Dropdown, Loader, NavButton, SearchBar} from 'superdesk-ui-framework/react';
import {IArticleSource, IListEntry} from '../interfaces';
import {ArticleRow} from './article-row';
import {getSourceLabel, PickerPane} from './picker-pane';

function entry(contentId: string): IListEntry {
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
    };
}

interface IMountOptions {
    source?: IArticleSource;
    entries?: Array<IListEntry>;
    loading?: boolean;
    hasMore?: boolean;
    listContentIds?: Set<string>;
    onSourceChange?: (source: IArticleSource) => void;
    onSearch?: (searchString: string) => void;
    onLoadMore?: () => void;
}

function mountPane(options: IMountOptions = {}): ReactWrapper {
    return mountWithCleanup(
        <DragDropContext onDragEnd={() => undefined}>
            <PickerPane
                source={options.source ?? 'published'}
                entries={options.entries ?? []}
                loading={options.loading ?? false}
                hasMore={options.hasMore ?? false}
                listContentIds={options.listContentIds ?? new Set()}
                onSourceChange={options.onSourceChange ?? (() => undefined)}
                onSearch={options.onSearch ?? (() => undefined)}
                onLoadMore={options.onLoadMore ?? (() => undefined)}
            />
        </DragDropContext>,
    );
}

describe('getSourceLabel', () => {
    it('returns a label for every source', () => {
        expect(getSourceLabel('published')).toBe('Published');
        expect(getSourceLabel('scheduled')).toBe('Scheduled');
        expect(getSourceLabel('in_progress')).toBe('In progress');
    });
});

describe('PickerPane', () => {
    it('shows a "no results" message when there are no entries', () => {
        expect(mountPane().text()).toContain('No results');
    });

    it('does not show "no results" while loading', () => {
        expect(mountPane({loading: true}).text()).not.toContain('No results');
    });

    it('shows a loader while loading', () => {
        expect(mountPane({loading: true}).find(Loader).length).toBe(1);
        expect(mountPane().find(Loader).length).toBe(0);
    });

    it('renders a row per entry', () => {
        const wrapper = mountPane({entries: [entry('a'), entry('b')]});

        expect(wrapper.find(ArticleRow).length).toBe(2);
    });

    it('shows the current source in the dropdown button', () => {
        const wrapper = mountPane({source: 'in_progress'});

        expect(wrapper.find(NavButton).prop('text')).toBe('In progress');
    });

    it('offers all sources in the dropdown and fires onSourceChange', () => {
        const onSourceChange = jasmine.createSpy('onSourceChange');
        const wrapper = mountPane({onSourceChange});

        const dropdownGroup = wrapper.find(Dropdown).prop('items')[0] as {
            label: string;
            items: Array<{label: string; active?: boolean; onSelect: () => void}>;
        };

        expect(dropdownGroup.items.map(({label}) => label))
            .toEqual(['Published', 'Scheduled', 'In progress']);
        expect(dropdownGroup.items[0].active).toBe(true);

        dropdownGroup.items[1].onSelect();

        expect(onSourceChange).toHaveBeenCalledWith('scheduled');
    });

    it('fires onSearch when the search bar submits', () => {
        const onSearch = jasmine.createSpy('onSearch');
        const wrapper = mountPane({onSearch});

        (wrapper.find(SearchBar).prop('onSubmit') as (value: string) => void)('query');

        expect(onSearch).toHaveBeenCalledWith('query');
    });

    it('dims and drag-disables articles that are already in the list', () => {
        const wrapper = mountPane({
            entries: [entry('a'), entry('b')],
            listContentIds: new Set(['a']),
        });

        const draggables = wrapper.find(Draggable);

        expect(draggables.at(0).prop('isDragDisabled')).toBe(true);
        expect(draggables.at(1).prop('isDragDisabled')).toBe(false);
        expect(wrapper.find(ArticleRow).at(0).prop('alreadyInList')).toBe(true);
        expect(wrapper.find(ArticleRow).at(1).prop('alreadyInList')).toBe(false);
    });

    it('loads more results when scrolled near the bottom', () => {
        const onLoadMore = jasmine.createSpy('onLoadMore');
        const wrapper = mountPane({hasMore: true, onLoadMore});
        const pane = wrapper.find(PickerPane).instance() as PickerPane;

        const scrollEvent = (scrollTop: number) => ({
            currentTarget: {scrollHeight: 1000, scrollTop, clientHeight: 300},
        }) as React.UIEvent<HTMLDivElement>;

        pane.handleScroll(scrollEvent(100));
        expect(onLoadMore).not.toHaveBeenCalled();

        pane.handleScroll(scrollEvent(650));
        expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('does not load more while loading or when everything is loaded', () => {
        const onLoadMore = jasmine.createSpy('onLoadMore');
        const nearBottom = {
            currentTarget: {scrollHeight: 1000, scrollTop: 650, clientHeight: 300},
        } as React.UIEvent<HTMLDivElement>;

        const loadingPane = mountPane({hasMore: true, loading: true, onLoadMore})
            .find(PickerPane).instance() as PickerPane;
        const exhaustedPane = mountPane({hasMore: false, onLoadMore})
            .find(PickerPane).instance() as PickerPane;

        loadingPane.handleScroll(nearBottom);
        exhaustedPane.handleScroll(nearBottom);

        expect(onLoadMore).not.toHaveBeenCalled();
    });
});
