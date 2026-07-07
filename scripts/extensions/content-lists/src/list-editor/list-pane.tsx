import * as React from 'react';
import {Draggable, Droppable} from 'react-beautiful-dnd';
import {Button, Dropdown, NavButton, SearchBar, SubNav} from 'superdesk-ui-framework/react';
import {IContentList, IListEntry} from '../interfaces';
import {superdesk} from '../superdesk';
import {getDuplicateContentIds} from '../utils';
import {ArticleRow} from './article-row';
import {LimitNotification} from './limit-notification';

const {gettext} = superdesk.localization;

interface IProps {
    list: IContentList;
    lists: Array<IContentList>;
    entries: Array<IListEntry>;
    loading: boolean;
    searchString: string;
    changesCount: number;
    saving: boolean;
    onSearch(searchString: string): void;
    onBack(): void;
    onOpenList(listId: string): void;
    onSave(): void;
    onPinUnpin(uid: string): void;
    onRemove(uid: string): void;
}

export class ListPane extends React.PureComponent<IProps> {
    render() {
        const {list, lists, entries, loading, searchString, changesCount, saving} = this.props;

        const limit = list.limit ?? null;
        const duplicateContentIds = getDuplicateContentIds(entries);
        const searchStringLowercase = searchString.trim().toLowerCase();
        const filtering = searchStringLowercase.length > 0;

        return (
            <div
                style={{display: 'flex', flexDirection: 'column', height: '100%'}}
                data-test-id="content-list--items-pane"
            >
                <SubNav>
                    <NavButton
                        icon="arrow-left"
                        text={gettext('Back to content lists')}
                        onClick={() => {
                            this.props.onBack();
                        }}
                    />
                    <SearchBar
                        placeholder={gettext('Search in list')}
                        onSubmit={(value: string) => {
                            this.props.onSearch(value);
                        }}
                        searchOptions={{searchOnType: true, searchDelay: 300}}
                    />
                    <Dropdown
                        items={[{
                            type: 'group',
                            label: gettext('Content lists'),
                            items: lists
                                .filter(({_id}) => _id !== list._id)
                                .map((otherList) => ({
                                    label: otherList.name,
                                    onSelect: () => {
                                        this.props.onOpenList(otherList._id);
                                    },
                                })),
                        }]}
                    >
                        <NavButton
                            text={list.name}
                            onClick={() => false}
                        />
                    </Dropdown>
                    <div style={{marginInlineStart: 'auto', paddingInlineEnd: '1rem'}}>
                        <Button
                            text={gettext('Save')}
                            type="primary"
                            disabled={changesCount < 1 || saving}
                            onClick={() => {
                                this.props.onSave();
                            }}
                        />
                    </div>
                </SubNav>
                <div style={{flexGrow: 1, overflowY: 'auto'}} data-test-id="content-list--items">
                    {
                        entries.length < 1 && !loading && (
                            <div className="sd-margin--2" style={{textAlign: 'center'}}>
                                <h2 className="sd-text__center sd-text--light">
                                    {gettext('Drag your articles here')}
                                </h2>
                            </div>
                        )
                    }
                    <Droppable droppableId="contentList">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{minHeight: '100%', padding: '0.8rem'}}
                            >
                                {
                                    entries.map((entry, index) => {
                                        const hiddenBySearch = filtering
                                            && !entry.title.toLowerCase().includes(searchStringLowercase);

                                        return (
                                            <React.Fragment key={entry.uid}>
                                                {
                                                    limit != null && limit > 0 && index === limit && (
                                                        <LimitNotification limit={limit} />
                                                    )
                                                }
                                                <Draggable
                                                    draggableId={entry.uid}
                                                    index={index}
                                                    isDragDisabled={entry.sticky || filtering}
                                                >
                                                    {(draggableProvided) => (
                                                        <div
                                                            ref={draggableProvided.innerRef}
                                                            {...draggableProvided.draggableProps}
                                                            {...draggableProvided.dragHandleProps}
                                                            style={{
                                                                ...draggableProvided.draggableProps.style,
                                                                display: hiddenBySearch ? 'none' : undefined,
                                                                cursor: entry.sticky ? 'not-allowed' : 'grab',
                                                            }}
                                                        >
                                                            <ArticleRow
                                                                entry={entry}
                                                                index={index}
                                                                showExtras={true}
                                                                isDuplicate={duplicateContentIds.has(entry.contentId)}
                                                                willBeTrimmed={
                                                                    limit != null && limit > 0 && index >= limit
                                                                }
                                                                onPinUnpin={() => {
                                                                    this.props.onPinUnpin(entry.uid);
                                                                }}
                                                                onRemove={() => {
                                                                    this.props.onRemove(entry.uid);
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            </React.Fragment>
                                        );
                                    })
                                }
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
        );
    }
}
