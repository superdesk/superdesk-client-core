import * as React from 'react';
import {Draggable, Droppable} from 'react-beautiful-dnd';
import {Dropdown, Loader, NavButton, SearchBar, SubNav} from 'superdesk-ui-framework/react';
import {IArticleSource, IListEntry} from '../interfaces';
import {superdesk} from '../superdesk';
import {ArticleRow} from './article-row';

const {gettext} = superdesk.localization;

const SCROLL_THRESHOLD_PX = 100;

export function getSourceLabel(source: IArticleSource): string {
    switch (source) {
        case 'published':
            return gettext('Published');
        case 'scheduled':
            return gettext('Scheduled');
        case 'in_progress':
            return gettext('In progress');
    }
}

const SOURCES: Array<IArticleSource> = ['published', 'scheduled', 'in_progress'];

interface IProps {
    source: IArticleSource;
    entries: Array<IListEntry>;
    loading: boolean;
    hasMore: boolean;
    onSourceChange(source: IArticleSource): void;
    onSearch(searchString: string): void;
    onLoadMore(): void;
}

export class PickerPane extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleScroll = this.handleScroll.bind(this);
    }

    handleScroll(event: React.UIEvent<HTMLDivElement>) {
        const element = event.currentTarget;
        const nearBottom =
            element.scrollHeight - element.scrollTop - element.clientHeight < SCROLL_THRESHOLD_PX;

        if (nearBottom && !this.props.loading && this.props.hasMore) {
            this.props.onLoadMore();
        }
    }

    render() {
        const {source, entries, loading} = this.props;

        return (
            <div
                style={{display: 'flex', flexDirection: 'column', height: '100%'}}
                data-test-id="content-list--picker-pane"
            >
                <SubNav>
                    <Dropdown
                        items={[{
                            type: 'group',
                            label: gettext('Source'),
                            items: SOURCES.map((sourceOption) => ({
                                label: getSourceLabel(sourceOption),
                                active: sourceOption === source,
                                onSelect: () => {
                                    this.props.onSourceChange(sourceOption);
                                },
                            })),
                        }]}
                    >
                        <NavButton
                            text={getSourceLabel(source)}
                            onClick={() => false}
                        />
                    </Dropdown>
                    <SearchBar
                        placeholder={gettext('Search articles')}
                        onSubmit={(value: string) => {
                            this.props.onSearch(value);
                        }}
                        searchOptions={{searchOnType: true, searchDelay: 300}}
                    />
                </SubNav>
                <div
                    style={{flexGrow: 1, overflowY: 'auto'}}
                    onScroll={this.handleScroll}
                    data-test-id="content-list--picker-results"
                >
                    <Droppable droppableId="articles" isDropDisabled={true}>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{minHeight: '100%', padding: '0.8rem'}}
                            >
                                {
                                    entries.length < 1 && !loading && (
                                        <div className="sd-margin--2" style={{textAlign: 'center'}}>
                                            <h3 className="sd-text--light">{gettext('No results')}</h3>
                                        </div>
                                    )
                                }
                                {
                                    entries.map((entry, index) => (
                                        <Draggable
                                            key={entry.uid}
                                            draggableId={entry.uid}
                                            index={index}
                                        >
                                            {(draggableProvided) => (
                                                <div
                                                    ref={draggableProvided.innerRef}
                                                    {...draggableProvided.draggableProps}
                                                    {...draggableProvided.dragHandleProps}
                                                    style={{
                                                        ...draggableProvided.draggableProps.style,
                                                        cursor: 'grab',
                                                    }}
                                                >
                                                    <ArticleRow entry={entry} />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))
                                }
                                {provided.placeholder}
                                {
                                    loading && (
                                        <div style={{position: 'relative', height: '3rem'}}>
                                            <Loader />
                                        </div>
                                    )
                                }
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
        );
    }
}
