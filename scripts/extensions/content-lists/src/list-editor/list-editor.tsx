import * as React from 'react';
import {debounce} from 'lodash';
import {DragDropContext, DropResult} from 'react-beautiful-dnd';
import {Loader} from 'superdesk-ui-framework/react';
import {fetchListItems, getList, isConflictError, saveItemChanges} from '../api';
import {searchArticles} from '../article-search';
import {IArticleSource, IContentList, IItemChange, IListEntry} from '../interfaces';
import {addArticleChangesListener, addListItemsChangeListener} from '../live-updates';
import {superdesk} from '../superdesk';
import {fixPinnedItemsPosition, listItemToEntry, moveBetween, recordChange, reorder} from '../utils';
import {ListPane} from './list-pane';
import {PickerPane} from './picker-pane';

const {gettext} = superdesk.localization;
const {notify} = superdesk.ui;

const LIST_ITEMS_MAX = 500;

interface IProps {
    listId: string;
    lists: Array<IContentList>;
    onBack(): void;
    onOpenList(listId: string): void;
}

interface IArticlesState {
    entries: Array<IListEntry>;
    nextPage: number; // zero-based
    total: number;
    loading: boolean;
}

interface IState {
    list: IContentList | null;
    entries: Array<IListEntry> | null;
    changesRecord: Array<IItemChange>;
    listSearchString: string;
    source: IArticleSource;
    articleSearchString: string;
    articles: IArticlesState;
    saving: boolean;
}

export class ListEditor extends React.PureComponent<IProps, IState> {
    public isDragging: boolean;
    private uidSequence: number;
    private _mounted: boolean;
    private removeListenerFunctions: Array<() => void>;
    private refreshFromServerDebounced: () => void;
    private refreshArticlesDebounced: () => void;

    constructor(props: IProps) {
        super(props);

        this.state = {
            list: null,
            entries: null,
            changesRecord: [],
            listSearchString: '',
            source: 'published',
            articleSearchString: '',
            articles: {entries: [], nextPage: 0, total: 0, loading: false},
            saving: false,
        };

        this.isDragging = false;
        this.uidSequence = 0;
        this._mounted = false;
        this.removeListenerFunctions = [];

        this.reloadListItems = this.reloadListItems.bind(this);

        // Refreshes triggered by websocket events are skipped while dragging
        // or when there are unsaved changes; the 409 handling on save covers
        // the unsaved-changes case.
        this.refreshFromServerDebounced = debounce(() => {
            if (!this.isDragging && !this.hasUnsavedChanges()) {
                this.reloadListItems();
            }
        }, 1000);

        this.refreshArticlesDebounced = debounce(() => {
            if (!this.isDragging) {
                this.loadArticles(this.state.source, this.state.articleSearchString, true);
            }
        }, 1000);
        this.loadMoreArticles = this.loadMoreArticles.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.pinUnpin = this.pinUnpin.bind(this);
        this.removeEntry = this.removeEntry.bind(this);
        this.save = this.save.bind(this);
    }

    componentDidMount() {
        this._mounted = true;

        this.reloadListItems();
        this.loadArticles(this.state.source, this.state.articleSearchString, true);

        this.removeListenerFunctions = [
            addListItemsChangeListener(this.props.listId, () => {
                this.refreshFromServerDebounced();
            }),
            addArticleChangesListener(() => {
                this.refreshArticlesDebounced();
            }),
        ];
    }

    componentWillUnmount() {
        this._mounted = false;
        this.removeListenerFunctions.forEach((removeListener) => removeListener());
    }

    hasUnsavedChanges(): boolean {
        return this.state.changesRecord.length > 0;
    }

    reloadListItems(): Promise<void> {
        return Promise.all([
            getList(this.props.listId),
            fetchListItems(this.props.listId, {maxResults: LIST_ITEMS_MAX}),
        ])
            .then(([list, itemsResponse]) => {
                if (!this._mounted) {
                    return;
                }

                this.setState({
                    list,
                    entries: itemsResponse._items.map(listItemToEntry),
                    changesRecord: [],
                });
            })
            .catch(() => {
                notify.error(gettext('Could not load the content list.'));
                this.props.onBack();
            });
    }

    loadArticles(source: IArticleSource, searchString: string, reset: boolean): void {
        const {articles} = this.state;

        if (articles.loading) {
            return;
        }

        const nextPage = reset ? 0 : articles.nextPage;

        this.setState({
            source,
            articleSearchString: searchString,
            articles: {
                entries: reset ? [] : articles.entries,
                nextPage,
                total: reset ? 0 : articles.total,
                loading: true,
            },
        }, () => {
            searchArticles(source, searchString, nextPage)
                .then((result) => {
                    if (!this._mounted) {
                        return;
                    }

                    // ignore stale responses
                    if (this.state.source !== source || this.state.articleSearchString !== searchString) {
                        return;
                    }

                    this.setState({
                        articles: {
                            entries: reset
                                ? result.entries
                                : this.state.articles.entries.concat(result.entries),
                            nextPage: nextPage + 1,
                            total: result.total,
                            loading: false,
                        },
                    });
                })
                .catch(() => {
                    if (!this._mounted) {
                        return;
                    }

                    this.setState({articles: {...this.state.articles, loading: false}});
                    notify.error(gettext('Could not load articles.'));
                });
        });
    }

    loadMoreArticles() {
        this.loadArticles(this.state.source, this.state.articleSearchString, false);
    }

    onDragStart() {
        this.isDragging = true;
    }

    onDragEnd(result: DropResult) {
        this.isDragging = false;

        const {source, destination, draggableId} = result;
        const entries = this.state.entries;

        if (destination == null || entries == null) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            if (source.droppableId !== 'contentList' || source.index === destination.index) {
                return;
            }

            const reordered = fixPinnedItemsPosition(reorder(entries, source.index, destination.index));
            const movedEntry = reordered.find((entry) => entry.uid === draggableId);

            if (movedEntry == null) {
                return;
            }

            this.setState({
                entries: reordered,
                changesRecord: recordChange(
                    this.state.changesRecord,
                    'move',
                    movedEntry.contentId,
                    reordered,
                ),
            });
        } else if (source.droppableId === 'articles' && destination.droppableId === 'contentList') {
            const moved = moveBetween(this.state.articles.entries, entries, source.index, destination.index);

            this.uidSequence += 1;

            const uid = `added-${this.uidSequence}`;
            const addedEntry = {...moved.destination[destination.index], uid};

            moved.destination[destination.index] = addedEntry;

            const updatedEntries = fixPinnedItemsPosition(moved.destination);

            this.setState({
                entries: updatedEntries,
                articles: {...this.state.articles, entries: moved.source},
                changesRecord: recordChange(
                    this.state.changesRecord,
                    'add',
                    addedEntry.contentId,
                    updatedEntries,
                ),
            });
        }
    }

    pinUnpin(uid: string) {
        const entries = this.state.entries;

        if (entries == null) {
            return;
        }

        const index = entries.findIndex((entry) => entry.uid === uid);

        if (index < 0) {
            return;
        }

        const entry = entries[index];
        const sticky = !entry.sticky;
        const updatedEntries = [...entries];

        updatedEntries[index] = {
            ...entry,
            sticky,
            stickyPosition: sticky ? index : null,
        };

        this.setState({
            entries: updatedEntries,
            changesRecord: recordChange(
                this.state.changesRecord,
                'move',
                entry.contentId,
                updatedEntries,
                sticky,
            ),
        });
    }

    removeEntry(uid: string) {
        const entries = this.state.entries;

        if (entries == null) {
            return;
        }

        const index = entries.findIndex((entry) => entry.uid === uid);

        if (index < 0) {
            return;
        }

        const removedEntry = entries[index];
        const updatedEntries = fixPinnedItemsPosition(
            entries.filter((entry) => entry.uid !== uid),
        );

        this.setState({
            entries: updatedEntries,
            changesRecord: recordChange(
                this.state.changesRecord,
                'delete',
                removedEntry.contentId,
                updatedEntries,
            ),
        });
    }

    save() {
        const {list, changesRecord} = this.state;

        if (list == null || changesRecord.length < 1) {
            return;
        }

        this.setState({saving: true});

        saveItemChanges(list._id, list.content_list_items_updated_at ?? null, changesRecord)
            .then(() => {
                if (!this._mounted) {
                    return;
                }

                this.setState({saving: false});
                notify.success(gettext('Content list saved.'));

                return this.reloadListItems();
            })
            .catch((error) => {
                if (!this._mounted) {
                    return;
                }

                this.setState({saving: false});

                if (isConflictError(error)) {
                    notify.error(gettext('Cannot save. The list has been modified by another user.'));
                    this.reloadListItems();
                } else {
                    notify.error(gettext('Could not save the content list.'));
                }
            });
    }

    render() {
        const {list, entries, changesRecord, listSearchString, source, articles, saving} = this.state;

        if (list == null || entries == null) {
            return <Loader overlay />;
        }

        return (
            <DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
                <div
                    style={{display: 'flex', height: '100%'}}
                    data-test-id="content-list--editor"
                >
                    <div style={{flex: 1, minWidth: 0, borderInlineEnd: '1px solid var(--sd-colour-line--medium)'}}>
                        <ListPane
                            list={list}
                            lists={this.props.lists}
                            entries={entries}
                            loading={false}
                            searchString={listSearchString}
                            changesCount={changesRecord.length}
                            saving={saving}
                            onSearch={(value) => {
                                this.setState({listSearchString: value});
                            }}
                            onBack={() => {
                                this.confirmDiscardingChanges().then((confirmed) => {
                                    if (confirmed) {
                                        this.props.onBack();
                                    }
                                });
                            }}
                            onOpenList={(listId) => {
                                this.confirmDiscardingChanges().then((confirmed) => {
                                    if (confirmed) {
                                        this.props.onOpenList(listId);
                                    }
                                });
                            }}
                            onSave={this.save}
                            onPinUnpin={this.pinUnpin}
                            onRemove={this.removeEntry}
                        />
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                        <PickerPane
                            source={source}
                            entries={articles.entries}
                            loading={articles.loading}
                            hasMore={articles.entries.length < articles.total}
                            onSourceChange={(nextSource) => {
                                this.loadArticles(nextSource, this.state.articleSearchString, true);
                            }}
                            onSearch={(value) => {
                                this.loadArticles(this.state.source, value, true);
                            }}
                            onLoadMore={this.loadMoreArticles}
                        />
                    </div>
                </div>
            </DragDropContext>
        );
    }

    private confirmDiscardingChanges(): Promise<boolean> {
        if (!this.hasUnsavedChanges()) {
            return Promise.resolve(true);
        }

        return superdesk.ui.confirm(
            gettext('There are unsaved changes which will be lost. Continue?'),
        );
    }
}
